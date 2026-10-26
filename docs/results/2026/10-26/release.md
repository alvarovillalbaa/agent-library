# Agent Library production release

Published [application](https://agent-library-rust.vercel.app) and [personal GitHub repository](https://github.com/alvarovillalbaa/agent-library). The complete requirements remain in [the product contract](../../../spec.md).

## Delivery and resources

- Runtime source commit: `7a09e8fca8f82237cf1f423351589c571233f719`.
- Vercel project: `prj_zQtT6rGQr17DO3iwHBAvByPo8be7`, GitHub-connected main, production deployment `dpl_BsJBq5voiht42mgrAm8Tqa8ASim4`, READY.
- Public alias: `https://agent-library-rust.vercel.app`; stable team alias: `https://agent-library-my-team-4f230354.vercel.app`.
- Hosted Convex project: `agent-library`, project `3291912`, production `graceful-mandrill-120`, URL `https://graceful-mandrill-120.convex.cloud`.
- A deployment-scoped Convex key is encrypted in Vercel. The account-wide CLI login token was not copied to the hosting project. The relay secret is server-only in the two owning services. Environment names and exact secret equality were checked privately without printing values.
- Convex storage was kept as explicitly required. The team had no paid subscription; no plan was upgraded. Model inference runs inside Vercel using request-context OIDC, then Convex validates the report before publication. No new provider key or CI workflow was created.

## Observed behavior

| Requirement | Evidence | Result |
| --- | --- | --- |
| Dedicated public source and hosted app | GitHub API metadata, remote main readback, Vercel READY state, public HTTP 200 | Passed |
| Persistent real catalogue | [Public query readback](catalogue-readback.json) | Four actual entries, one per resource type |
| Fresh AI review and revision | [Live review responses](live-review.json) | Eight-check rejection plus repair prompt; revised command passed all eight checks and was published |
| Separate curator provenance | Public catalogue/detail metadata | Original Research brief, Evidence editor and existing Search Gateway adapter labelled curator-reviewed; comparison command labelled AI-reviewed |
| Navigation, search and filters | [Browser checks](browser-checks.json) | Skills/MCP/Subagent/Command routes, evidence search, combined Product/creator filtering and empty state observed |
| Complete details and copying | Browser DOM and clipboard readback | Pinned source/license/review details; exact skill install command, full subagent and full approved command copied |
| Text submission and duplicate result | Browser form and [result screenshot](duplicate-review.png) | Command selection, full text and attribution retained; public action recognized the exact published package with no additional model review |
| Mobile rendering | [Mobile catalogue](mobile-catalogue.png), [mobile form](mobile-submission.png), browser measurements | No horizontal overflow in the observed catalogue/form; mobile GitHub link was given an accessible name and rechecked |
| Invalid inputs and publication boundary | [Submission checks](submission-checks.json) | Seven invalid packages rejected; unauthenticated internal-import attempt failed; IDs and counters unchanged |
| Server credentials absent from client assets | [Delivered asset hashes and checks](asset-checks.json) | Exact deployment-key and relay-secret bytes absent from public JS/CSS; not a general security audit |
| Native file/folder selection | Browser chooser attempt | Unverified: browser extension rejected file assignment; user handoff required |

Two complete live model responses were observed in the rejection/revision sequence, within the approved bounded verification scope. Each request caps output at 3,000 tokens; no application-level paid retry or provider fallback occurs. Exact invoiced cost and provider-log attribution were not retrieved. The earlier unavailable attempt happened before the relay could obtain runtime authentication and did not publish anything.

## Checks and fixes

- Source ES-module syntax, JSON/configuration and required-file checks passed; frontend TS/TSX syntax was inspected with an already available parser. `git diff --check` passed. No local dependency installation, full TypeScript compile, local app build or dev server was run.
- The first hosted build exposed a removed Lucide brand-icon export; the unsupported import was removed. The next hosted build succeeded and deployed Convex functions plus the Vite app.
- The first real submission correctly failed closed when runtime OIDC was read only from an environment variable. The implementation now uses the official `@vercel/oidc` helper inside the request handler. After that fix, the real model review and persistence sequence succeeded.
- Targeted submission checks used invalid synthetic input and made zero model calls. They did not insert test records. Catalogue entries are real authored or attributed resources.

## Open proof boundaries

The browser-control skill's supported upload troubleshooting requires enabling file-URL access for the ChatGPT Chrome extension. No alternate browser mechanism or file-upload workaround was used. Native file/folder upload, cross-browser behavior, assistive-technology coverage, rate-limit exhaustion and concurrent submission behavior remain unverified. The initial browser action checked exact-package deduplication; the later [Meeting handoff browser acceptance](meeting-handoff-browser.md) separately proves a fresh rejected-model report, exact repair-prompt copying, edited resubmission, eight-check approval, public detail and full-content copying after publication.

Initial source/production snapshots and later evidence-only commits are distinct. A subsequent documentation deployment does not change the runtime proof scope recorded here.
