# Agent Library

Public catalogue for business-focused skills, MCP servers, subagents and commands. Product source: the agent-library brief in Alvaro's Notion page `311a1ee8-bd06-805c-aa21-c5306dd315ac`.

- Keep the full product contract in `docs/spec.md`. Convex owns persistent catalogue data; do not replace it with another database or pretend local fixtures are production records.
- No sign-in is required to browse or submit. Public clients must never write directly to approved entries. Only a server-owned successful review or authenticated owner import may publish.
- Treat submitted files as untrusted text. Never execute, fetch, render as HTML, or install their contents. Never expose credentials or rejected submissions in public queries.
- UI components live in `src/components/`; reuse the UI primitives. Handle empty, loading, failed, narrow-screen and keyboard states.
- Use `apply_patch` for manual source edits. Preserve existing work and keep generated Convex files untracked.
- Use targeted syntax/import/static checks and `git diff --check`. Do not run backend tests, broad typechecks, local builds, servers or browser checks without explicit authorization. A remote Vercel production build is part of the user's authorized publication goal.
- Run Storage Guard before installations/builds. A failure stops local installs/builds; hosted builds are separate. Never erase unrelated data to continue.
- Record publication and acceptance proof under `docs/`; source checks do not prove hosted persistence or live model behavior.
- Publication to a dedicated personal GitHub repository and Vercel is authorized by the active user goal. Do not change billing plans, enable paid subscriptions, or create CI workflows without explicit approval.
