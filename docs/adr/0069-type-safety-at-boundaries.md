# 0069 - Type Safety At Boundaries

- Status: accepted

## Context

The codebase is already mostly strict, but import/share features add new untrusted boundaries.

## Decision

Validate all imported, shared, and restored project payloads with Zod before use. No untyped JSON should reach UI state directly.

## Consequences

- Import and share helpers must produce and consume the same schema.

## Alternatives Considered

- Trust parsed JSON structures: rejected as unsafe and brittle.
