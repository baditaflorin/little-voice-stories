# Phase 2 Substance Plan

## Ranked Substance Items

1. Add confidence scores on drawing and voice inferences. (§2.16)
2. Add actionable domain errors for unsupported, corrupt, huge, and weak inputs. (§2.32)
3. Validate file and media boundaries before deep processing. (§2.33)
4. Add drawing subject and scene inference from filename, pixel signals, and quality signals. (§2.6, §2.13)
5. Ground story generation in inferred subject and visible drawing hints. (§2.8, §2.11)
6. Normalize drawing signals and source metadata. (§2.9, §2.15)
7. Surface low-confidence and anomaly suggestions inline. (§2.17, §2.18)
8. Explain inference decisions through reasons. (§2.19)
9. Add voice quality gate for duration, energy, clipping, and noisiness. (§2.12, §2.32)
10. Add recoverable vs fatal error taxonomy. (§2.34)
11. Add deterministic source IDs and provenance to generated stories. (§2.22, §2.38)
12. Add fixture-backed determinism tests. (§2.35)
13. Add real-data fixture suite and synthetic edge suite. (§2.1, §2.5)
14. Add size budgets and performance measurement docs. (§2.3, §2.28)
15. Add cancellation to drawing analysis UI. (§2.26)
16. Make repeated clicks/concurrent analysis deterministic by aborting prior work. (§2.27)
17. Enumerate reachable app states. (§2.24)
18. Ensure each state has a user-actionable exit. (§2.25)
19. Cache repeated fixture/drawing inference by source hash. (§2.31)
20. Add debug inspectability via `?debug=1`. (§2.37)
21. Add activity history for inspectability. (§2.36)
22. Remember subject corrections within the session. (§2.39)

## Non-Goals

No new feature surfaces, no backend, no visual polish, no exact neural voice cloning claim, and no Mode C escalation.
