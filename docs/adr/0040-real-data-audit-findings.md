# 0040 - Real-Data Audit Findings And Substance Metrics

## Status

Accepted

## Context

V1 works for the curated demo but fails or overstates confidence on real drawings, photos, unsupported files, and weak voice samples.

## Decision

Use the 10 fixture scenarios in `docs/phase2-substance/realdata-audit.md` as the Phase 2 grading rubric. Substance success requires confidence, subject grounding, actionable errors, voice quality gates, determinism, and performance budgets.

## Consequences

All inference changes must improve or preserve fixture pass rate. Any known tradeoff must be documented before shipping.

## Alternatives Considered

Using only synthetic unit tests was rejected because the goal is real-data behavior.
