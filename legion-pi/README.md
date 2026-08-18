# Legion Pi

Legion Pi is the pinned Pi distribution baseline for LegionMind. It keeps the runtime, extensions, generated settings, sessions, package cache, and lifecycle state inside one removable profile.

## Requirements

- Node.js 24 or newer
- npm
- Network access while installing the pinned npm packages

## One source config

`legion-pi.json` is the only configuration file a user maintains. It contains:

- the review date;
- one exact Pi runtime pin;
- the three exact extension pins;
- additional skill search paths.

It intentionally contains no provider, model, credential, web, or MCP server configuration.

`setup-pi install` generates the upstream files that Pi and pi-subagents require:

- `<profile>/agent/settings.json`;
- `<profile>/agent/extensions/subagent/config.json`;
- `<profile>/.legionmind/active-config.v1.json`.

These are managed outputs, not additional user configuration sources.

## Defaults

- Pi keeps its native initial tool surface: `read`, `bash`, `edit`, and `write`.
- `grep`, `find`, and `ls` remain available through Pi tool selection without adding another distribution setting.
- Provider login and model selection use Pi login state, environment variables, or CLI flags.
- No MCP server is bundled. `pi-mcp-adapter` starts with only its `mcpScript` and `mcp` proxy tools.
- Subagents start foreground-first, with depth 1, at most 2 children per run, 4 per parent session, and 1 active async run. Missions and schedules are disabled. Worktree discard, destructive cleanup, and spawn-budget grants require confirmation; schedule creation is forbidden.

## Commands

From this repository:

```bash
node bin/setup-pi.js install --profile-dir .cache/legion-pi/profile
node bin/setup-pi.js verify --profile-dir .cache/legion-pi/profile
node bin/setup-pi.js rollback --profile-dir .cache/legion-pi/profile
```

Use `--config <path>` to install from a customized single config; keep that source outside the profile's installer-owned `runtime/`, `agent/`, `sessions/`, and `.legionmind/` paths. Use `--force` only after reviewing a drift warning; the installer backs up replaced managed files. `rollback` restores a prior backup batch, but refuses if a target changed after that backup or a backup entry is missing. `rollback --force` first preserves newer drift in a separate recovery batch. To undo a first install that has no predecessor, remove the isolated profile directory.

The installed Pi executable is:

```text
<profile>/runtime/node_modules/.bin/pi
```

Run it with the profile paths exported so CLI, subagents, pi-lens, and future Web sessions share the same installation:

```bash
PI_CODING_AGENT_DIR="<profile>/agent" \
PI_CODING_AGENT_SESSION_DIR="<profile>/sessions" \
PI_SUBAGENT_PI_BINARY="<profile>/runtime/node_modules/.bin/pi" \
PI_LENS_HOME="<profile>/.legionmind/pi-lens" \
"<profile>/runtime/node_modules/.bin/pi"
```

## Isolated reproduction

The following procedure redirects HOME, XDG, npm cache, Pi configuration, sessions, and the npm installation prefix into the repository. It does not touch the real user profile.

```bash
ROOT="$PWD/.cache/legion-pi-repro"
PROFILE="$ROOT/profile"

HOME="$ROOT/home" \
XDG_CONFIG_HOME="$ROOT/xdg/config" \
XDG_DATA_HOME="$ROOT/xdg/data" \
XDG_CACHE_HOME="$ROOT/xdg/cache" \
npm_config_cache="$ROOT/npm-cache" \
node bin/setup-pi.js install \
  --profile-dir "$PROFILE" \
  --config "$PWD/legion-pi/legion-pi.json"

HOME="$ROOT/home" \
XDG_CONFIG_HOME="$ROOT/xdg/config" \
XDG_DATA_HOME="$ROOT/xdg/data" \
XDG_CACHE_HOME="$ROOT/xdg/cache" \
node bin/setup-pi.js verify --profile-dir "$PROFILE"

node scripts/verify-pi-startup-matrix.js \
  --profile-dir "$PROFILE" \
  --output "$ROOT/startup-matrix.md"
```

Expected results:

- install returns `OK_INSTALL`;
- verify returns `READY`;
- all 8 startup-matrix rows return `PASS`;
- the matrix binds those rows to the active config, exact installed manifests, and canonical in-profile package roots;
- no files appear outside `$ROOT` except reads of this checkout and registry network traffic.

The reviewed matrix for the committed pins is in `startup-matrix.md`.

The matrix removes its own scratch directory on every run, so it rejects a `--config` under that scratch root and requires `--output` to remain outside the Legion Pi profile. Setup and matrix bind package manifests, entrypoints, and the Pi binary to canonical in-profile roots. Startup probes isolate HOME/XDG/temp paths and build a minimal environment allowlist before loading extensions; they never inherit credential locators or treat a skipped probe as success.

## Persistent Web backend

Web installation belongs to Linear `0XC-302`, not this skeleton. That work item has a hard requirement for a long-running backend so sessions continue when browsers disconnect.

The current primary candidate is `@jmfederico/pi-web`: its separate session daemon and web/API service match the persistence requirement and support desktop, tablet, and mobile browsers. `@agegr/pi-web` remains the simpler single-process fallback.

The Web service must reuse the Legion Pi agent and session directories, bind to loopback by default, and stay a console rather than a Legion control-plane backend. Remote browser access will use FRP. The public FRP endpoint must provide HTTPS and authentication; neither the Pi runtime nor a loopback-only Web listener should be exposed directly.
