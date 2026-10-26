import { v } from 'convex/values';

export const kind = v.union(v.literal('skill'), v.literal('mcp'), v.literal('subagent'), v.literal('command'));
export const area = v.union(v.literal('Engineering'), v.literal('Product'), v.literal('Design'), v.literal('Marketing'), v.literal('Sales'), v.literal('Finance'), v.literal('People'), v.literal('Operations'));
export const files = v.array(v.object({ path: v.string(), content: v.string() }));
export const submission = v.object({
  kind: v.union(v.literal('skill'), v.literal('subagent'), v.literal('command')),
  title: v.string(), summary: v.string(), area, owner: v.string(),
  repository: v.optional(v.string()), license: v.string(), files,
});
export const check = v.object({ id: v.string(), title: v.string(), passed: v.boolean(), issue: v.string(), fix: v.string() });
export const generatedDetails = v.object({ overview: v.string(), bestFor: v.array(v.string()), considerations: v.array(v.string()) });
export const reviewMetadata = v.object({ method: v.string(), model: v.optional(v.string()), version: v.string(), reviewedAt: v.number() });

export const entryFields = {
  slug: v.string(), kind, title: v.string(), summary: v.string(), area, owner: v.string(),
  repository: v.optional(v.string()), sourceUrl: v.optional(v.string()), license: v.string(), files,
  overview: v.string(), bestFor: v.array(v.string()), considerations: v.array(v.string()),
  review: reviewMetadata, publishedAt: v.number(), contentHash: v.string(), searchText: v.string(),
};
