# 0064 - DRY Consolidation Map

- Status: accepted

## Context

The codebase had little hard duplication, but several related concerns were still scattered inside the workspace component and storage boundary.

## Decision

Consolidate around these single sources of truth:

- portable project schema and migration
- app settings schema and defaults
- export/import helpers
- share-state helpers

Avoid speculative abstractions for tiny UI handlers.

## Consequences

- Shared schemas become reusable in UI, storage, import, and tests.

## Alternatives Considered

- Major UI refactor into many new files first: rejected as unnecessary for the current scope.
