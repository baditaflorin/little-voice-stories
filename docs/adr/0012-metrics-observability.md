# 0012 - Metrics And Observability

## Status

Accepted

## Context

The app is privacy-sensitive and static. Usage analytics are optional under the bootstrap guidance.

## Decision

Ship no analytics in v1. The only observability artifact is `docs/version.json`, which exposes build metadata.

## Consequences

- There is no tracking, no beacons, and no PII collection.
- Product success metrics must be measured by local testing and voluntary user feedback.

## Alternatives Considered

- Plausible analytics: privacy-respecting but still unnecessary for v1.
- Self-hosted beacon: rejected because it implies backend operations.
