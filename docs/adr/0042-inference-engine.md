# 0042 - Inference Engine

## Status

Accepted

## Context

The app needs useful first guesses from drawings without adding new user-facing setup.

## Decision

Use a deterministic heuristic inference engine that combines source filename tokens, pixel metrics, palette, and anomaly signals to infer subject, scene type, quality, story hints, confidence, reasons, and suggestions.

## Consequences

The engine is inspectable and deterministic. It is less powerful than neural vision, but it keeps Mode A private and fast.

## Alternatives Considered

Cloud vision APIs and bundled browser vision models were rejected for v2.0 because they add privacy, size, and reliability costs.
