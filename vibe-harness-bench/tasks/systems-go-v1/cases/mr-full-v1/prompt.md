# MapReduce Full

Implement the clean-room MapReduce simulator API exposed at the workspace root.

Required public API:

- package: `mrbench`
- function: `RunScenario(name string) Result`
- `Result` fields must report word counts, deterministic reduce outputs, lease reassignment, late-completion suppression, crash recovery, duplicate commits, and maximum observed parallelism.

The starter intentionally contains TODO stubs. Public and hidden verifiers inject Go tests against this API; do not change the package name or field names.
