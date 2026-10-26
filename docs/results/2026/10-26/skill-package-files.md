# Ordinary skill package files

The shared upload validator rejected extensionless `LICENSE`/`NOTICE` files and the documented `.env.example` filename. This made otherwise valid text skill folders fail before model review.

The fix accepts `LICENSE` and `NOTICE` basenames case-insensitively and allows the exact `.env.example` basename only in the final path segment. Private environment files, hidden directories, traversal, unsupported executables, binary content, credential patterns, duplicate paths and byte limits retain their existing checks.

Seven focused dependency-free regression checks passed after the fix. Against the prior source, five failed and two passed, confirming that the checks distinguish the repaired behavior from the old implementation. They include folder-root normalization and exact content preservation. Module syntax and `git diff --check` passed. No model call, database mutation, local install or local app build was used.

This closes the source validation defect. The separate browser file-chooser acceptance gap remains open until the supported Chrome extension file-access handoff is completed.
