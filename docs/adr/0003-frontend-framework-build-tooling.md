# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs a polished interactive UI, strict TypeScript, fast local builds, static GitHub Pages output, and good test support.

## Decision

Use React, TypeScript strict mode, and Vite. Styling is plain CSS with design tokens instead of Tailwind for v1 to keep the first-load payload small and reduce build moving parts.

## Consequences

- Vite builds directly into `docs/` with `base: "/little-voice-stories/"`.
- React provides reliable component composition for the wizard and media controls.
- Plain CSS keeps the bundle and dependency surface smaller than a utility framework for this small app.

## Alternatives Considered

- SvelteKit static: excellent fit, but React has broader ecosystem support for future WebLLM and media UI examples.
- Tailwind CSS: acceptable, but not necessary for this v1 and omitted to keep CSS explicit.
