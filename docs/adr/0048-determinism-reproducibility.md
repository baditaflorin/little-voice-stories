# 0048 - Determinism And Reproducibility

## Status

Accepted

## Context

Same input should produce the same story structure and inference metadata.

## Decision

Use deterministic hashes and seeded selection for generated stories. Generated story provenance includes schema version, app version, drawing source ID, subject, confidence, and parameters. Runtime timestamps are not part of deterministic story text.

## Consequences

Fixture tests can assert byte-identical outputs.

## Alternatives Considered

Using ambient randomness was rejected.
