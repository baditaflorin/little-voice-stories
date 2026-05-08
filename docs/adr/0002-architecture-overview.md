# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs a clear separation between private media handling, story generation, narration, and UI so that future model upgrades do not require rewiring the whole product.

## Decision

Use a feature-oriented frontend under `src/features/`:

- `drawing`: upload, canvas analysis, palette extraction, and character profile derivation.
- `story`: prompt construction, deterministic local story weaving, and optional WebLLM integration.
- `voice`: browser recording, voice-profile analysis, and SpeechSynthesis narration.
- `library`: IndexedDB persistence for projects and recordings metadata.
- `app`: shell, routing-free stepper flow, global toasts, and version metadata.

Shared code lives under `src/lib/`.

## Consequences

- Media never crosses a network boundary in the happy path.
- Optional AI modules can be lazy-loaded behind explicit user action.
- Tests can cover pure feature logic without rendering the whole app.

## Alternatives Considered

- Route-heavy SPA: rejected because v1 is one guided creation flow.
- Backend-centered modules: rejected by ADR 0001.
