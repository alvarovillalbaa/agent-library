# Acceptance status

The product contract is in [spec.md](spec.md). Publication is not full acceptance: inspect the dated release receipt for observed evidence and open requirements.

| Requirement | Proof needed |
| --- | --- |
| Public home and four catalogue pages | Deployed pages load; navigation and history work |
| Search, area and creator filters | Real records produce correct visible results |
| Complete individual details | Persistent record, files, provenance, strengths and considerations displayed |
| Skill installation and content copying | Correct install command and full command/subagent content copied |
| Single-type text and file/folder submission | Real upload/text cases, path/size checks and retained edits |
| Eight-check model review and fresh resubmission | Real provider response, validated check coverage, actionable failures and repair prompt |
| Server-owned approval | Public clients cannot bypass review; only a successful review or internal curator import publishes |
| Convex persistence | Real deployed query/write/read evidence, with no static/mock fallback |
| Responsive and keyboard interface | Authorized desktop/mobile/browser interaction checks |
| Dedicated personal GitHub and Vercel | Remote source readback, READY deployment and public HTTP checks |

Local Storage Guard measured 27.4 GiB free with 34.0 GiB required on 2026-10-26. No local dependency installation, app build or database provision was performed. The new Convex project is a hosted production resource, not a local test database.

## Published release — 2026-10-26

[Agent Library is live](https://agent-library-rust.vercel.app), with a dedicated public [GitHub repository](https://github.com/alvarovillalbaa/agent-library) and hosted Convex production database. The [release receipt](results/2026/10-26/release.md) links the source, deployment, live model-review, persistent catalogue, browser and invalid-submission evidence.

The observed model path rejected the initial original command with eight checks and a repair prompt, then approved its revision with eight passing checks and persisted it. The browser verified that exact public command and copied its full contents. Three separately labelled curator entries complete the initial four-type collection. Seven invalid packages and an unauthenticated import attempt did not alter the catalogue.

Navigation, search, combined filters, details, exact copying, mobile layout, text editing and the live duplicate-submission result were exercised in Chrome after explicit user approval. Native file/folder upload remains unverified: the browser connection failed during chooser file assignment and its supported guide requires a user extension-permission handoff. This is an open acceptance requirement, not a claimed pass. Cross-browser, full screen-reader, load and adversarial model evaluations remain outside these focused checks.

The later [Meeting handoff browser check](results/2026/10-26/meeting-handoff-browser.md) completes the previously missing direct rejection/repair-prompt/revision path. The actual text form received eight live checks, copied the 836-character repair prompt exactly, retained edited attribution/files, then submitted a revision that passed all eight checks. The new authored command was published, its full content copied exactly, and its public detail survived a direct reload. Native upload acceptance is still separate and incomplete.

The [28 October copy-feedback repair and upload retry](results/2026/10-28/copy-feedback.md)
records focused callback checks for stale clipboard feedback. The connected
Chrome file chooser still rejected file assignment with its file-URL access
error. File/folder acceptance and real-browser timing checks remain open.
