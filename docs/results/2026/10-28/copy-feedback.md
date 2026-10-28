# Copy feedback ownership

28 October 2026. The all-project delivery goal remains active.

The [product contract](../../../spec.md) requires copying exact installation
commands, resource files and repair prompts. In `CopyButton`, each pending
clipboard write previously set feedback unconditionally. An older completion
could overwrite a newer result or mark replacement text as copied.

The shared control now numbers attempts and accepts feedback only from the
current attempt. A layout-effect cleanup invalidates pending feedback when
text changes or the control unmounts; each new attempt clears earlier feedback.
The same button DOM and exact `writeText(text)` payload remain in use. This is
feedback ownership, not cancellation or ordering of operating-system writes.
The app uses client-only `createRoot`. The lifecycle choice follows the
[official React layout-effect contract](https://react.dev/reference/react/useLayoutEffect).

## Focused source checks

- Actual transpiled callback/lifecycle simulation: **27 passed, zero failed**.
  The same cases against baseline `442bf997d9cc69c14319a594fc849e51ed352c08`
  produce **11 passes and 16 failures**.
- Cases cover exact whitespace, multiline and Unicode text; current success,
  rejection and missing/throwing clipboard API; clearing feedback; older/newer
  completion orders; text replacement including A to B to A; unmount;
  StrictMode cleanup/setup; independent controls and same-text rerenders.
- TypeScript 5.9.3 syntax transpilation reports zero errors. The already
  installed parser was read without installation. This does not establish a
  complete TypeScript program or dependency parity.
- Repository ES-module syntax, configuration JSON and required-source checks
  passed with Node 24.21.0, as did independent source review and
  `git diff --check`.

Checked component SHA256:
`1a876457c19d3267dbe341b232d1e6255d8830aac872706701c2e2da06970c0f`.
The bounded temporary harness SHA256 is
`f74ecd19b4cc04411130bfb9d34e638cfcc61deebc752b55a389108d1b474b9a`.
The harness uses deferred promises and simulated hook lifecycles, not React,
a browser or the OS clipboard. No permanent implementation-mirroring test was
added for this small frontend repair.

## Approved native-upload retry

The existing focused-browser approval permits authored resource uploads.
Connected Chrome opened the live submission page, selected Command, and
opened its actual file chooser. It reported a single-file input. Assignment
of the repository's original `resources/commands/meeting-handoff.md` failed
with the extension's file-URL access error, before the application loaded it.
The supported Chrome upload troubleshooting was read; no alternate upload
mechanism was attempted. The [form screenshot](upload-retry.png) records the
selected single-file path with an empty editor, not a successful upload.

No review was submitted and no model call was made. The file/folder acceptance
gap remains open. No local build/install, backend test, schema/Auth/provider/CI/
configuration change was needed.

## Source and hosted delivery

Source [`b48d131ae4568ffafc26138769236eaad9a44762`](https://github.com/alvarovillalbaa/agent-library/commit/b48d131ae4568ffafc26138769236eaad9a44762)
was pushed to personal-repository main. Immutable GitHub readback matches the
component blob `90893059a516723f19e501f56a97c7cd2691e8d2`.
Vercel production [`dpl_7mrCXeUSUzqKgFo6A3dVgiqrsfyN`](https://vercel.com/my-team-4f230354/agent-library/7mrCXeUSUzqKgFo6A3dVgiqrsfyN)
reached READY at that exact SHA with the public aliases assigned. Logs show the
existing hosted Convex deployment and Vite 8.3.5 build completed, with build
output completed in 13 seconds. This is publication, not a backend regression
or model-review test.

Homepage GET returned 200 (1,016 bytes). Its client asset
`/assets/index-D_30NTVw.js` returned 200 (379,696 bytes), SHA256
`e88cd0cd0ffe69b417fb2a1f8bc9b244e4d7d152a15017b5f10f314f38572c3e`.
The delivered copy function contains layout cleanup, attempt increment and both
completion guards. Chrome's loaded page references this same asset.

## Limited live copy check

On the new deployment, the existing published Meeting handoff detail loaded.
Its expanded, visible file matches the original 2,316-character / 2,328-byte
source exactly (SHA256
`d84702d05efb76e4e1cebdad8b4f4f73dc307fca982ffbb98521d5d35d6de326`).
Clicking Copy command produced “Copy command: copied” while retaining focus on
that button. The [screenshot](copy-feedback-browser.png) records the visible
feedback, not clipboard-content acceptance.

The connector's clipboard read returned an empty string. A normal Command-V
in a disposable, unsubmitted form also failed because Browser Use reported
its virtual clipboard had no data. Supported browser troubleshooting was read.
Therefore exact current OS-clipboard readback is **unverified**, despite the
successful UI state and exact callback payload checks. No claim is made that
the empty connector read proves an application clipboard failure. No review,
model call or production write occurred during this check.

The earlier exact-copy browser receipts remain historical evidence. Real
overlapping-request/text-change timing, screen-reader feedback and OS clipboard
ordering remain unverified. The later receipt-only publication preserves the
checked runtime component bytes.
