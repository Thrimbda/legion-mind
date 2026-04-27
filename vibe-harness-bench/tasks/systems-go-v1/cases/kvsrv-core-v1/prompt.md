# KV Server Core

Implement the clean-room key/value API exposed at the workspace root.

Required public API:

- package: `kvbench`
- `NewStore() *Store`
- `Get(key) (value string, version int, err Err)`
- `Put(key, value, version) Err`
- `RetryPutAmbiguous(key, value, version) Err`
- `DuplicateDelayedSafe() bool`
- `ConcurrentHistoryLinearizable() bool`

The starter intentionally contains TODO stubs. Public and hidden verifiers inject Go tests against this API; do not change the package name, exported symbols, or error constants.
