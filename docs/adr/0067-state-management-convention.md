# 0067 - State Management Convention

- Status: accepted

## Context

The app currently uses local React state plus IndexedDB autosave. That approach is fine, but hidden settings and non-portable state make it incomplete.

## Decision

Use a single in-memory project state in the workspace, backed by:

- IndexedDB autosave
- portable JSON import/export
- optional share-hash restore for small payloads

Settings, activity log, and subject corrections belong to the same persisted project shape.

## Consequences

- There is one canonical project format for restore, import, and export.

## Alternatives Considered

- Introduce an external state library: rejected as unnecessary.
