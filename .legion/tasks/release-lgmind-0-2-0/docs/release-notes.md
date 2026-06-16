# Release notes: lgmind 0.2.0

## Highlights

- Adds the product-level `lgmind` CLI entrypoint.
- Adds `lgmind setup` runtime selection for supported agent runtimes:
  - `opencode`
  - `openclaw`
- Supports explicit non-interactive selection with `--agent opencode|openclaw`.
- Keeps `--runtime` as an alias for `--agent`.
- Keeps `setup-opencode` as the OpenCode-only compatibility alias.
- Makes default text output quieter by hiding successful lifecycle `OK_*` events while preserving warnings, errors, and final summaries.
- Preserves detailed output through `--verbose` and structured event output through `--json`.

## Compatibility

- Package name remains `lgmind`.
- npm access remains public.
- Node engine remains `>=22.6.0`.
- Existing `setup-opencode` usage remains supported.

## Publication target

- Version: `0.2.0`
- Registry: `https://registry.npmjs.org`
- Dist tag: `latest`
