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
gap remains open. The prior browser receipts remain historical evidence;
they do not verify this repair's timing in a real browser. Browser/React
scheduling, screen-reader feedback and OS clipboard ordering remain unverified.
No local build/install, backend test, schema/Auth/provider/CI/configuration
change was needed. Source and hosted publication evidence will be added after
delivery.
