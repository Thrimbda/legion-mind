# Harbor Benchmark Notes

This document is intentionally limited to current repo truth plus clearly labeled future intent.

## Current state

`legion-mind` does **not** currently ship an active benchmark harness in this repo surface.

- `package.json` does not define `benchmark:*` npm scripts.
- There is no committed `scripts/benchmark/` implementation in the repository.
- There is no current artifact contract or scorecard format enforced by checked-in code here.

The current architecture remains:

- `legion-workflow` is the control-plane entry.
- Local CLI/setup tooling is a filesystem-backed thin tool for asset install/verify flows.

## What does exist today

For local experimentation, the repo does include `shell.nix` with a Harbor wrapper:

```bash
nix-shell --run "harbor --version"
```

`shell.nix` uses `uv tool run --from harbor harbor ...`, so Harbor does not need to be installed globally when using that shell.

## Planned or historical intent

Earlier planning discussed a Harbor benchmark baseline with dedicated scripts, profiles, artifacts, and reports. That material should be treated as **planned or historical only**, not as a description of the current checked-in repo surface.

If benchmark automation is revived later, this document can be expanded once the following exist in-repo:

- committed benchmark scripts or commands,
- checked-in benchmark config/profile files,
- a documented artifact layout backed by implementation,
- verification coverage proving the workflow still works.

Until then, do not rely on `npm run benchmark:*` commands or `scripts/benchmark/*` paths in this repository.
