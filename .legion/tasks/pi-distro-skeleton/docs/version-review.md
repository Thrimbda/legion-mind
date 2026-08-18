# Legion Pi pin review

Review date: 2026-08-17

## Selected pins

| Package | Previous snapshot | Selected | License | Decision |
|---|---:|---:|---|---|
| `@earendil-works/pi-coding-agent` | `0.84.2` | `0.84.2` | MIT | Keep; registry latest is unchanged and the package requires Node `>=22.19.0`. Legion Pi itself requires Node 24. |
| `pi-subagents` | `0.50.0` | `0.50.0` | MIT | Keep; packaged configuration confirms separate subagent config, bounded depth/spawn controls, and fail-closed authority policy. |
| `pi-mcp-adapter` | `2.26.0` | `2.26.0` | MIT | Keep; release fixes host-agent directory resolution and startup collision scanning. No MCP servers are bundled by Legion Pi. |
| `pi-lens` | `4.0.0` | `4.0.1` | MIT | Update; `4.0.1` is a stable 2026-08-16 release with LSP, tool-list stability, and diagnostics fixes. |

## Installation review

- All four exact versions resolved from the npm registry on 2026-08-17.
- Pi core and all three extensions installed successfully in a repository-local profile with `npm_config_ignore_scripts=true`.
- A credential-free SDK startup loaded the three extensions with no loader errors and exposed unique tool names.
- Pi's package manager stores user packages under the selected `PI_CODING_AGENT_DIR`, so the installer can keep runtime, package cache, settings, and sessions inside one Legion Pi profile.

## Sources

- npm registry metadata and package tarballs for the exact selected versions.
- Packaged `CHANGELOG.md`, `package.json`, and configuration documentation from each tarball.
- `.legion/tasks/evaluate-pi-control-plane/docs/research.md` section 4 and RFC section 8.2.
