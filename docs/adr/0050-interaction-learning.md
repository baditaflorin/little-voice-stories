# 0050 - Interaction Learning Policy

## Status

Accepted

## Context

If a user corrects the inferred subject once, similar generation in the same session should respect it.

## Decision

Remember subject corrections only in current in-memory session state. Do not create cross-session behavioral learning in v2.0.

## Consequences

The app feels less repetitive without becoming opaque or surprising.

## Alternatives Considered

Persistent per-user defaults were deferred because they need more UI transparency.
