# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live GitHub Pages URL must work from day one. Documentation also needs to live in the repository.

## Decision

Publish GitHub Pages from `main` branch `/docs` folder.

Vite builds generated assets into `docs/` with `base: "/little-voice-stories/"`. Documentation markdown and ADRs also live under `docs/`; `scripts/clean-pages.mjs` removes only generated Pages files before each build so documentation is preserved.

The live URL is https://baditaflorin.github.io/little-voice-stories/.

## Consequences

- The built frontend is committed and served directly by GitHub Pages.
- `docs/` must not be gitignored.
- SPA fallback is handled by copying `docs/index.html` to `docs/404.html`.

## Alternatives Considered

- `gh-pages` branch: rejected because the requirement favors visible committed publish artifacts.
- `main:/` root publishing: rejected because source and build files would be mixed at repo root.
