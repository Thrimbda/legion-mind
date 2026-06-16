# Publish result: lgmind 0.2.0

## Summary

PASS. The `0.2.0` release is published and npm `latest` now resolves to `0.2.0`.

## Release PRs

- Release version bump PR: #22, merged as `432ce5e chore: prepare lgmind 0.2.0 release (#22)`.
- Trusted-publishing workflow PR: #23, merged as `2275526 ci: add npm trusted publish workflow (#23)`.

## Publication

- Local publish attempt reached the correct artifact but was blocked by npm `EOTP`.
- Publication was completed through GitHub Actions workflow run `27597051575` after npm trusted publisher configuration.
- Workflow run: `https://github.com/Thrimbda/legion-mind/actions/runs/27597051575`

## Registry verification

```json
{
  "version": "0.2.0",
  "dist-tags.latest": "0.2.0",
  "versions": ["0.1.0", "0.2.0"]
}
```
