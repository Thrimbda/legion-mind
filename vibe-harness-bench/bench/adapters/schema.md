# Command adapter schema

Adapter files are JSON-compatible YAML objects with:

- `id`: stable adapter id
- `mode`: `command`
- `command`: argv array
- `timeout_grace_sec`: integer grace seconds
- `supports_metrics`: boolean

The runner injects only allowlisted HUT paths via environment variables. Protected task pack paths are never passed to adapters.
