import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { kind, area, files, generatedDetails, submission, check } from './validators';
import { LIMITS, REVIEW_CHECKS, validateSubmission } from '../lib/catalog.mjs';

const PAGE_LIMIT = 100;

export const list = query({
  args: { kind: v.optional(kind), area: v.optional(area), owner: v.optional(v.string()), search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const search = args.search?.trim().slice(0, 160);
    const owner = args.owner?.trim().slice(0, 39);
    let matching;
    if (search) {
      matching = await ctx.db.query('entries').withSearchIndex('search_catalog', q => {
        let filter = q.search('searchText', search);
        if (args.kind) filter = filter.eq('kind', args.kind);
        if (args.area) filter = filter.eq('area', args.area);
        if (owner) filter = filter.eq('owner', owner);
        return filter;
      }).take(PAGE_LIMIT + 1);
    } else {
      let selection = args.kind ? ctx.db.query('entries').withIndex('by_kind', q => q.eq('kind', args.kind!))
        : args.area ? ctx.db.query('entries').withIndex('by_area', q => q.eq('area', args.area!))
        : owner ? ctx.db.query('entries').withIndex('by_owner', q => q.eq('owner', owner))
        : ctx.db.query('entries');
      if (args.area) selection = selection.filter(q => q.eq(q.field('area'), args.area));
      if (owner) selection = selection.filter(q => q.eq(q.field('owner'), owner));
      matching = await selection.order('desc').take(PAGE_LIMIT + 1);
    }
    const stats = await ctx.db.query('catalogueStats').withIndex('by_name', q => q.eq('name', 'all')).unique();
    const creators = await ctx.db.query('creators').withIndex('by_owner').take(251);
    const entries = matching.slice(0, PAGE_LIMIT).map(({ files: _files, searchText: _search, contentHash: _hash, _creationTime: _created, ...entry }) => entry);
    return {
      entries,
      owners: creators.slice(0, 250).map(creator => creator.owner),
      counts: { skill: stats?.skill ?? 0, mcp: stats?.mcp ?? 0, subagent: stats?.subagent ?? 0, command: stats?.command ?? 0 },
      truncated: matching.length > PAGE_LIMIT || creators.length > 250,
    };
  },
});

export const detail = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    if (slug.length > 140) return null;
    const found = await ctx.db.query('entries').withIndex('by_slug', q => q.eq('slug', slug)).unique();
    if (!found) return null;
    const { searchText: _search, contentHash: _hash, _creationTime: _created, ...entry } = found;
    return entry;
  },
});

export const reserveReview = internalMutation({
  args: { requestId: v.string(), contentHash: v.string() },
  handler: async (ctx, { requestId, contentHash }) => {
    const existing = await ctx.db.query('entries').withIndex('by_hash', q => q.eq('contentHash', contentHash)).unique();
    if (existing) return { existingSlug: existing.slug, reserved: false };
    const now = Date.now();
    const quota = await ctx.db.query('reviewQuota').withIndex('by_name', q => q.eq('name', 'global')).unique();
    const slots = (quota?.slots ?? []).filter(slot => slot.at > now - 60 * 60 * 1000);
    if (slots.length >= LIMITS.reviewPerHour) return { reserved: false };
    slots.push({ id: requestId, at: now });
    if (quota) await ctx.db.patch(quota._id, { slots });
    else await ctx.db.insert('reviewQuota', { name: 'global', slots });
    return { reserved: true };
  },
});

// Requests stopped before inference may release their reservation.
export const releaseReview = internalMutation({
  args: { requestId: v.string() },
  handler: async (ctx, { requestId }) => {
    const quota = await ctx.db.query('reviewQuota').withIndex('by_name', q => q.eq('name', 'global')).unique();
    if (quota) await ctx.db.patch(quota._id, { slots: quota.slots.filter(slot => slot.id !== requestId) });
  },
});

type EntryInput = Omit<Doc<'entries'>, '_id' | '_creationTime' | 'slug' | 'publishedAt' | 'searchText'>;

async function insertEntry(ctx: MutationCtx, entry: EntryInput): Promise<{ slug: string }> {
  const existing = await ctx.db.query('entries').withIndex('by_hash', q => q.eq('contentHash', entry.contentHash)).unique();
  if (existing) return { slug: existing.slug };
  const base = `${entry.owner}-${entry.title}`.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96) || 'library-entry';
  // The complete content hash prevents title collisions and remains stable on retry.
  const slug = `${base}-${entry.contentHash.slice(0, 24)}`;
  const collision = await ctx.db.query('entries').withIndex('by_slug', q => q.eq('slug', slug)).unique();
  if (collision) throw new Error('Entry identifier conflict.');
  const publicEntry = {
    ...entry, slug, publishedAt: Date.now(),
    searchText: [entry.title, entry.summary, entry.overview, entry.owner, entry.area, ...entry.bestFor].join(' ').slice(0, 8000),
  };
  await ctx.db.insert('entries', publicEntry);
  const stats = await ctx.db.query('catalogueStats').withIndex('by_name', q => q.eq('name', 'all')).unique();
  const counts = {
    skill: (stats?.skill ?? 0) + (entry.kind === 'skill' ? 1 : 0),
    mcp: (stats?.mcp ?? 0) + (entry.kind === 'mcp' ? 1 : 0),
    subagent: (stats?.subagent ?? 0) + (entry.kind === 'subagent' ? 1 : 0),
    command: (stats?.command ?? 0) + (entry.kind === 'command' ? 1 : 0),
  };
  if (stats) await ctx.db.patch(stats._id, counts);
  else await ctx.db.insert('catalogueStats', { name: 'all', ...counts });
  const creator = await ctx.db.query('creators').withIndex('by_owner', q => q.eq('owner', entry.owner)).unique();
  if (creator) await ctx.db.patch(creator._id, { count: creator.count + 1 });
  else await ctx.db.insert('creators', { owner: entry.owner, count: 1 });
  return { slug };
}

export const publishReviewed = internalMutation({
  args: { submission, details: generatedDetails, checks: v.array(check), contentHash: v.string(), model: v.string(), version: v.string() },
  handler: async (ctx, args) => {
    const validated = validateSubmission(args.submission);
    if (!validated.ok || !validated.submission) throw new Error('Invalid package.');
    const expected = REVIEW_CHECKS.map(item => item.id);
    if (args.checks.length !== expected.length || !expected.every(id => args.checks.some(item => item.id === id && item.passed))) throw new Error('A complete successful review is required.');
    if (!/^[a-f0-9]{64}$/.test(args.contentHash)) throw new Error('Invalid package hash.');
    return insertEntry(ctx, {
      ...validated.submission, ...args.details,
      contentHash: args.contentHash,
      ...(validated.submission.repository ? { sourceUrl: validated.submission.repository } : {}),
      review: { method: 'ai-reviewed', model: args.model, version: args.version, reviewedAt: Date.now() },
    });
  },
});

/** Internal functions are callable with deployment-admin credentials, never by a browser client. */
export const importEntry = internalMutation({
  args: {
    kind, title: v.string(), summary: v.string(), area, owner: v.string(), repository: v.optional(v.string()),
    sourceUrl: v.string(), license: v.string(), files, details: generatedDetails, contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    if (!/^https:\/\/[^\s]+$/.test(args.sourceUrl) || !/^[a-f0-9]{64}$/.test(args.contentHash)) throw new Error('Source provenance and SHA-256 hash are required.');
    if (args.title.length < 3 || args.title.length > LIMITS.title || args.summary.length < 20 || args.summary.length > LIMITS.summary || args.files.length > LIMITS.files) throw new Error('Invalid curator metadata.');
    if (args.kind !== 'mcp') {
      const validated = validateSubmission(args);
      if (!validated.ok) throw new Error('Curated package failed validation.');
    }
    const { details, ...entry } = args;
    return insertEntry(ctx, { ...entry, ...details, review: { method: 'curator-reviewed', version: 'owner-import-v1', reviewedAt: Date.now() } });
  },
});
