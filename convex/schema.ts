import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { entryFields } from './validators';

export default defineSchema({
  entries: defineTable(entryFields)
    .index('by_slug', ['slug'])
    .index('by_hash', ['contentHash'])
    .index('by_kind', ['kind'])
    .index('by_area', ['area'])
    .index('by_owner', ['owner'])
    .searchIndex('search_catalog', { searchField: 'searchText', filterFields: ['kind', 'area', 'owner'] }),
  catalogueStats: defineTable({ name: v.string(), skill: v.number(), mcp: v.number(), subagent: v.number(), command: v.number() }).index('by_name', ['name']),
  creators: defineTable({ owner: v.string(), count: v.number() }).index('by_owner', ['owner']),
  reviewQuota: defineTable({ name: v.string(), slots: v.array(v.object({ id: v.string(), at: v.number() })) }).index('by_name', ['name']),
});
