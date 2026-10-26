# Agent Library

A public collection of skills, MCP servers, subagents and commands for business work. Browse by business area or creator, inspect an item's complete files, and copy what you need. Submit a skill, subagent or command for an eight-check AI review without creating an account.

[Open Agent Library](https://agent-library-rust.vercel.app) · [Source](https://github.com/alvarovillalbaa/agent-library)

The catalogue is backed by Convex. Accepted entries become public only after the server validates a successful review. MCP servers are curated by the operator. Submitted text is never executed by this app.

## Development

Requires Node 22.12+ and npm. Before installing or building in Alvaro's workspace, run the workspace Storage Guard; a failed reserve check stops local installation/builds.

```sh
npm install
npx convex dev
npm run dev
```

Configure a Convex development deployment using your own account. Copy `.env.example` to `.env.local` and supply `VITE_CONVEX_URL`. The production deployment key belongs only in your hosting provider's encrypted server-side environment; never use a `VITE_` name for it. Do not connect a local development server to production for test submissions.

```sh
npm run check
git diff --check
```

These are source checks. A hosted build, a database round trip and a real model review have separate acceptance evidence.

## Hosting

Create a dedicated Convex production deployment. Import this repository into Vercel using its Vite preset and Node 24. Add the deployment-scoped `CONVEX_DEPLOY_KEY` as an encrypted production variable and the public deployment URL as `VITE_CONVEX_URL`.

The Convex deploy command supplies the production URL to the UI build and publishes the backend as part of the same hosted job. Without a deploy key it can build the UI, but that does not update or prove the backend. A missing catalogue connection produces an unavailable state, never sample entries.

See [the product contract](docs/spec.md), [operations](docs/operations.md) and [acceptance status](docs/acceptance.md). This initial release has no scheduled automation or CI workflow. Its GitHub-linked Vercel deployment is the publication path.

MIT licensed. Catalogue item licenses and provenance are shown individually; the application license does not relicense submitted content.
