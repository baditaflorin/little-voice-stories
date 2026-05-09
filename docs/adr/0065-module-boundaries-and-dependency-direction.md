# 0065 - Module Boundaries And Dependency Direction

- Status: accepted

## Context

`ProjectWorkspace.tsx` orchestrates nearly every user flow, but the product is still small enough that a full architectural rewrite would cost more than it would save.

## Decision

Keep the UI shell in `ProjectWorkspace.tsx`, but move boundary logic into focused helpers under `src/features/library/` and `src/lib/`:

- storage and migrations
- import/export serialization
- share-state encoding

UI depends on helpers; helpers do not depend on UI.

## Consequences

- The main component stays large but becomes less responsible for domain and boundary logic.

## Alternatives Considered

- Split the entire screen into a new multi-module architecture in Phase 3: rejected as too disruptive for completeness work.
