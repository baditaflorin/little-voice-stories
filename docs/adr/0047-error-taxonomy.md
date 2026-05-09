# 0047 - Error Taxonomy And Messaging

## Status

Accepted

## Context

Browser media and file APIs fail for predictable domain reasons.

## Decision

Classify errors as recoverable or fatal. Recoverable errors keep current work intact. Every error message must include what failed, why it happened in domain terms, and what to try next.

## Consequences

Unsupported files, weak drawings, and bad voice samples become guided recovery paths.

## Alternatives Considered

Throwing raw exceptions into toast copy was rejected.
