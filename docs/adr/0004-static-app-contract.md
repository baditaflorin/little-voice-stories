# 0004 - Static App Contract

## Status

Accepted

## Context

Mode A has no API and no static data pipeline, but the app still needs a stable public artifact contract for GitHub Pages and metadata display.

## Decision

The Pages artifact contract is:

- `docs/index.html`: production app entry.
- `docs/404.html`: SPA fallback copied from `index.html`.
- `docs/assets/*`: hashed JS/CSS assets.
- `docs/manifest.webmanifest`: PWA metadata.
- `docs/sw.js`: service worker.
- `docs/version.json`: version, commit, branch, build timestamp, repository URL, and support URL.

## Consequences

- Users and smoke tests can read version metadata without running source code.
- Documentation markdown also lives under `docs/`, so the build script cleans only generated asset paths.

## Alternatives Considered

- Runtime REST API: rejected by ADR 0001.
- Release-hosted data artifacts: not needed for v1.
