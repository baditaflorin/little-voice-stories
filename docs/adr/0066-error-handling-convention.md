# 0066 - Error Handling Convention

- Status: accepted

## Context

Phase 2 introduced `DomainError`, but several flows still relied on click-then-fail behavior instead of guided copy.

## Decision

Continue to use `DomainError` for domain failures and surface them through toasts or inline status with:

- what failed
- why it failed in product language
- what to do next

For capability-gated actions, add pre-click guidance where practical.

## Consequences

- Import, share, clipboard, and Local AI messaging should follow the same pattern.

## Alternatives Considered

- Raw thrown errors only: rejected as too technical.
