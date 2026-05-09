# 0068 - Persistence Schema And Migration Policy

- Status: accepted

## Context

Phase 2 saved one project shape with no explicit schema version or migration policy.

## Decision

Introduce a versioned portable project schema and migrate stored state on read. Older local records should be upgraded in memory rather than silently discarded.

## Consequences

- Export files become future-compatible.
- Tests must cover migration and round-trip behavior.

## Alternatives Considered

- Break old saved state between versions: rejected as hostile to real users.
