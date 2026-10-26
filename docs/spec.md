# Product contract

Source: [Alvaro's agent-library brief](https://app.notion.com/p/311a1ee8bd06805caa21c5306dd315ac), read 2026-10-26. The parent has three omitted external embeds; the agent-library text itself is present. Preserve the requested scope even where service configuration remains incomplete.

1. Public, carefully designed business-agent catalogue with no required authentication.
2. Home and dedicated Skills, MCP Servers, Subagents and Commands pages. Search; filter by business area and creator. Every item has its own address and detailed view with back navigation, overview, considerations, strengths and characteristics.
3. Public submission of exactly one of skills, subagents or commands. Text entry and local files/folders are supported. Skills can contain multiple files; subagents and commands contain one. MCP entries are owner-managed.
4. A server-side AI review performs eight item-specific checks. Rejection explains each problem, the required fixes and a copyable repair prompt. Editing and resubmitting performs a fresh review. A failed, missing or malformed review cannot publish.
5. Skill cards expose `npx skills add owner/repo`. Commands and subagents copy the complete submitted content. Source and license remain visible. Creator labels identify submitter-provided attribution, not verified identity.
6. Reuse UI components throughout the app. Handle loading, errors, empty catalogues and mobile/keyboard operation.
7. Convex is explicitly required for database storage. A static or in-memory catalogue is not a substitute. No fabricated entries or model responses.
8. Active user goal adds a dedicated repository under `alvarovillalbaa`, Vercel publication, and verified release evidence.

## Transport contract

Frontend calls Convex functions through named references. Shared validation/constants are in `lib/catalog.mjs` (dependency-free) with declarations in `lib/catalog.d.mts`.

- `catalog:list` query: `{kind?: "skill"|"mcp"|"subagent"|"command", area?: string, owner?: string, search?: string}` → `{entries: Entry[], owners: string[], counts: Record<Kind,number>, truncated: boolean}`. Return at most 100 catalogue entries; expose truncation. Only approved entries are public.
- `catalog:detail` query: `{slug: string}` → `Entry|null`, including public files, review metadata and original source link.
- `review:submit` action: `{submission: Submission}` → `ReviewResult`. Validates all metadata/files, reserves a bounded global review slot, performs server-side AI review, validates its complete response, and publishes atomically only on success. `Submission.kind` excludes MCP.
- `catalog:importEntry` internal owner mutation: reachable through the authenticated Convex administrator CLI, not through a browser endpoint or public boolean. Owner imports must preserve provenance and are labelled curator-reviewed.

`Entry`: `_id`, `slug`, `kind`, `title`, `summary`, `area`, `owner`, `repository?`, `sourceUrl?`, `license`, `files: {path, content}[]`, `overview`, `bestFor: string[]`, `considerations: string[]`, `review: {method, model?, version, reviewedAt}`, `publishedAt`.

`Submission`: `kind`, `title`, `summary`, `area`, `owner`, `repository?`, `license`, `files`.

`ReviewResult`: `status: "approved"|"changes_requested"|"invalid"|"unavailable"|"rate_limited"`, `summary`, `checks: {id, title, passed, issue, fix}[]`, `repairPrompt`, `entrySlug?`. Public error messages must not contain provider responses, stack traces, credentials or internal deployment configuration.

Limits: 24 files for a skill, one for a subagent/command; 48 KiB per file; 128 KiB aggregate UTF-8 text; safe relative paths only; no duplicate paths, secrets, binary content or network fetches. Skill requires `SKILL.md` with valid name/description frontmatter. Preserve files exactly after normalizing directory-upload root paths. File limits also apply on the server. Model requests are deadline- and token-bounded; anonymous reviews have an atomic global rolling quota.
