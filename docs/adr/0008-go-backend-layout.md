# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap template defines a Go backend layout for Modes B and C.

## Decision

Skip Go backend scaffolding in v1 because ADR 0001 chooses Mode A.

## Consequences

- No `cmd/`, `internal/`, `pkg/`, `api/`, `configs/`, or Docker backend files are created.
- No Go linter, Go tests, or Go dependency policy applies until a backend exists.

## Alternatives Considered

- Add an unused Go skeleton: rejected because unused code would add maintenance cost and false operational complexity.
