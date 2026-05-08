# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Browser media APIs fail often due to permissions, unsupported features, and hardware differences.

## Decision

Use typed result objects for feature logic and user-facing toast notices for recoverable UI errors. Avoid throwing across React event boundaries. Keep fallback paths for LLM generation, speech synthesis, and voice recording.

## Consequences

- Users get clear next actions instead of silent failures.
- Tests can assert error states without relying on console output.

## Alternatives Considered

- Global exception-only handling: rejected because media errors need specific recovery copy.
