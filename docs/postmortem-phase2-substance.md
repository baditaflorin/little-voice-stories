# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before: 0/10 fixtures met the Phase 2 substance bar without caveats. V1 demoed, but every real-data scenario exposed either generic subject guessing, weak input handling, unclear failure, or ungated voice quality.

After: 10/10 fixture contracts pass in `npm test`. Seven supported drawing fixtures now produce a useful first guess or an explicit low-confidence correction path, the PDF fixture fails actionably, and both voice fixtures are handled by quality or policy gates.

| Fixture                   | Before                                 | After                                       |
| ------------------------- | -------------------------------------- | ------------------------------------------- |
| `clean-house-tree`        | Generic character seed                 | House/tree subject, high confidence         |
| `photo-shadow-paper`      | Silently included shadow/background    | Drawing photo label, crop/brighter guidance |
| `toddler-sparse-smiley`   | Overconfident sparse interpretation    | Smiley face, low confidence, add-note fix   |
| `huge-story-cover`        | Slow generic analysis, no cancel path  | Story cover guess, large-file guidance      |
| `multipage-art-pdf`       | Generic decode failure                 | PDF-specific what/why/next-step error       |
| `low-contrast-sketch`     | Nearly empty generic output            | Faint drawing, low-contrast guidance        |
| `dataset-emotion-drawing` | Ignored family/emotion context         | Family subject with story hint              |
| `mixed-subject-text`      | No hierarchy between people/house/text | Mixed subject and choose-focus suggestion   |
| `short-noisy-voice`       | Weak profile accepted                  | Too-short/quiet/noisy gate                  |
| `long-multispeaker-audio` | Unsupported policy was not explicit    | Mic-only, single-parent guidance            |

## Logic Gaps Closed

1. Drawing analysis now outputs subject, scene type, confidence, reasons, quality, and issue suggestions.
2. Story generation is grounded in the inferred subject and carries deterministic provenance.
3. Low-confidence guesses are visible in the UI and in debug state.
4. Voice profiling now gates duration, energy, warmth/noise, and clipping.
5. Unsupported formats, huge files, cancellation, and imported public audio produce domain-language errors.

## Smart Behaviors Evidence

- Useful first guess: `inferDrawingIntelligence` passes all real-data drawing expectations.
- Honest uncertainty: sparse and low-contrast fixtures are low-confidence instead of confidently wrong.
- Story grounding: template and WebLLM prompts include subject, confidence, reasons, and story hints.
- Voice gate: fixture-backed quality tests catch short/noisy recordings before narration.
- Inspectability: `?debug=1` shows source metadata, inference, confidence, issues, provenance, and activity.

## Determinism

Pass. The story engine test generates the same object twice for the same drawing/character input. Drawing fixture inference uses deterministic string normalization and numeric thresholds. Story provenance uses stable source ids and a stable story id rather than timestamps.

## Performance

- `npm test`: 17 tests passed in about 2 seconds, with fixture test work reported under 100ms in the latest run.
- `npm run build`: production Pages bundle built in under 1 second locally.
- `npm run smoke`: Playwright happy path passed in about 2 seconds.

The fixture set uses real-data descriptors and observed signals rather than vendored binary images/audio. That keeps the repo light and license-safe, but it means the automated performance numbers cover the inference engine rather than browser image decode for each source asset.

## Surprises

- Filename normalization carried more useful signal than expected for child-art datasets and public examples.
- The biggest "feels smart" improvement was not a new model; it was refusing to be overconfident.
- Voice quality needed plain recording guidance more than extra controls.

## Still Open

1. True paper detection/cropping is still heuristic; the app warns, but does not crop.
2. Subject inference should eventually use a local vision model or shape classifier.
3. Exact parent voice cloning remains out of scope for static GitHub Pages; current narration is browser speech synthesis shaped by local profile features.
4. Fixture binaries should be added only where licenses and size budgets are clear.
5. Long-running WebLLM generation still needs a stronger cancellation model.

## Honest Take

It feels much less like a toy now for the original surface area: drawing in, story out, parent-style narration. A stranger can bring a messy drawing/photo/voice sample and get a useful first guess or a clear correction path.

It is not yet magical. The drawing intelligence is still threshold-and-metadata based, not true visual understanding, and the voice experience is profile-guided browser narration rather than neural cloning. The important change is that the app now knows when it is unsure, says why, and preserves enough provenance to debug the result.
