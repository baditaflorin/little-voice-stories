# 0017 - Dependency Policy

## Status

Accepted

## Context

The app uses sensitive local media and should keep dependencies intentional.

## Decision

Use production-ready libraries only when they remove real risk or complexity:

- React and Vite for UI/build.
- Zod for schemas.
- TanStack Query for future static artifact/model metadata fetching.
- idb for IndexedDB ergonomics.
- WebLLM as optional experimental local LLM integration.
- Vitest, ESLint, Prettier, and Playwright for local quality gates.

Run `npm audit` and avoid high/critical vulnerabilities.

## Consequences

- No custom persistence wrapper over raw IndexedDB.
- No custom LLM runtime.
- Optional heavy dependencies must be lazy-loaded.

## Alternatives Considered

- Zero dependencies: rejected because media and UI complexity would move into brittle custom code.
