# 0046 - Performance Budgets

## Status

Accepted

## Context

Phone photos and large drawings can block the browser if treated like tiny demo assets.

## Decision

Adopt the budgets in `docs/perf/phase2-substance.md`: normal analysis under 1s median, 5MB p95 under 3s, visible progress for slow work, rejection over 15MB, and cancellable analysis.

## Consequences

Large inputs are treated honestly instead of making the app appear frozen.

## Alternatives Considered

Unlimited decode attempts were rejected.
