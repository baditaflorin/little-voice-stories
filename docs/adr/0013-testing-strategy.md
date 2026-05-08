# 0013 - Testing Strategy

## Status

Accepted

## Context

The app needs confidence in pure generation logic, media analysis helpers, and the published static flow.

## Decision

Use:

- Vitest for unit tests colocated with source.
- React Testing Library for component tests where useful.
- Playwright for one smoke-level happy path against the built `docs/` app.
- `make test`, `make lint`, `make build`, and `make smoke` as local verification targets.

## Consequences

- Checks are fast enough for local hooks.
- Browser API-heavy behavior is smoke-tested at the UI level and unit-tested where deterministic.

## Alternatives Considered

- GitHub Actions: rejected by project constraint.
- Only manual QA: rejected because generation logic needs repeatable coverage.
