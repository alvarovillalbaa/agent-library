# Operating the library

## Ownership

Convex is the persistent source of truth. Public catalogue queries expose approved entries only. Submissions pass through `review:submit`; no public mutation may directly approve an entry. The public interface has no login and never requests provider credentials.

Use the deployment administrator CLI for owner-managed imports, including MCP server records. `catalog:importEntry` is internal: a browser cannot invoke it. Supply real provenance and a license that permits publication. Do not import another author's full skill or prompt without the appropriate redistribution right. Keep curator-reviewed imports distinguishable from model-reviewed community submissions.

## Deployment

- `VITE_CONVEX_URL`: public production deployment URL, available to the UI.
- `CONVEX_DEPLOY_KEY`: encrypted server-only Vercel production variable scoped to this Convex deployment. Used only by the hosted build. Do not copy an account-wide Convex login token into the repository or hosting project.
- `REVIEW_RELAY_SECRET`: an encrypted server-only Vercel variable shared only with this Convex deployment. It authenticates the private model relay; never put it in a `VITE_` variable.
- `REVIEW_RELAY_URL`, `REVIEW_RELAY_SECRET`, `REVIEW_MODEL`: Convex environment variables. The URL is the stable production Vercel alias plus `/api/review-model`. This release uses `openai/gpt-4o-mini`, verified in the live Vercel model catalogue on 2026-10-26. The model relay runs inside Vercel and authenticates to AI Gateway with its runtime OIDC token; it never sends that token to Convex. Its configured model and output-token cap are fixed server-side.

For a standalone Convex deployment, omitting both relay variables selects native Convex AI Gateway using a deployment-scoped short-lived token. That path may require an eligible paid plan. There is no automatic retry through another provider after a failed relay and no automatic billing upgrade.

Official references: [Vercel deployment](https://docs.convex.dev/production/hosting/vercel), [Management API](https://docs.convex.dev/management-api/overview), [internal functions](https://docs.convex.dev/functions/internal-functions), [Convex AI Gateway setup](https://docs.convex.dev/ai-gateway/setup), [Vercel OIDC authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc).

## Initial catalogue

`node scripts/curated-imports.mjs /path/to/imports.json` prepares attributed import records from the repository's original skill, command and subagent files, plus a pinned reference to the existing Search Gateway MCP adapter. It performs no database writes. These are real resources, not demonstration fixtures. Use the administrator's authenticated internal mutation only after reviewing their files and source licenses. The import's recorded method is curator review; do not describe it as AI approval.

## Submission behavior

The UI explains that accepted metadata and files become public. Rejected content is not exposed by catalogue queries. File and aggregate limits are enforced on both sides. The service does not execute commands, fetch submitted URLs, inspect repositories on behalf of submitters, or execute submitted instructions. Creator names are attribution supplied by the submitter; a passed AI review does not verify identity or guarantee an item's safety.

A structurally invalid submission gets actionable preflight feedback. Model/network/configuration failure leaves the submission unpublished. The model's entire report is validated before any write to approved entries. A response with missing, duplicate, failed or malformed checks cannot approve an entry. Anonymous review calls use an atomic global budget to bound spend; after the limit, the service asks the submitter to retry later. This quota is a spending ceiling, not a guarantee against all public-service abuse.

## Verification and recovery

Check `/api/health` for hosting configuration, then query the catalogue and submit/review a permitted real item to verify the complete path. Health alone does not prove database connectivity or model access. Keep source commit, hosting deployment ID, catalogue evidence and model-review evidence distinct in release receipts.

Use Convex's supported backups and deployment rollback controls for recovery. Preserve published records and source provenance. Never clear the production catalogue to make a test pass. Use an owned development deployment for destructive tests and name its teardown path before provisioning it.
