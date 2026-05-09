# 0045 - State Taxonomy And State Machine

## Status

Accepted

## Context

Real inputs create loading, low-confidence, recoverable-error, cancelled, and warning states.

## Decision

Use the taxonomy in `docs/phase2-substance/states.md`. Every state has an exit. Drawing analysis can be cancelled, and repeated analysis aborts prior work.

## Consequences

No state should leave users stuck or unsure what to try next.

## Alternatives Considered

Implicit boolean loading flags were rejected as insufficient for real-data behavior.
