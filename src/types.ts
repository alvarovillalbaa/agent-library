export type Kind = 'skill' | 'mcp' | 'subagent' | 'command';
export type SubmissionKind = Exclude<Kind, 'mcp'>;
export type SourceFile = { path: string; content: string };
export type Entry = {
  _id: string;
  slug: string;
  kind: Kind;
  title: string;
  summary: string;
  area: string;
  owner: string;
  repository?: string;
  sourceUrl?: string;
  license: string;
  overview: string;
  bestFor: string[];
  considerations: string[];
  review: { method: string; model?: string; version: string; reviewedAt: number };
  publishedAt: number;
  files?: SourceFile[];
};
export type CatalogResponse = {
  entries: Entry[];
  owners: string[];
  counts: Record<Kind, number>;
  truncated: boolean;
};
export type Submission = {
  kind: SubmissionKind;
  title: string;
  summary: string;
  area: string;
  owner: string;
  repository?: string;
  license: string;
  files: SourceFile[];
};
export type ReviewResult = {
  status: 'approved' | 'changes_requested' | 'invalid' | 'unavailable' | 'rate_limited';
  summary: string;
  checks: { id: string; title: string; passed: boolean; issue: string; fix: string }[];
  repairPrompt: string;
  entrySlug?: string;
};
