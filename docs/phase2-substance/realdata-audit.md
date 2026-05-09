# Phase 2 Substance Real-Data Audit

## Fixture Set

The v1 app was checked against 10 real-world input scenarios drawn from public child-art, voice, and dataset sources. Full binary copies are not vendored when source licensing or size is unclear; the committed fixture inputs record source URL, observed input characteristics, and expected domain behavior.

Sources:

- https://commons.wikimedia.org/wiki/Category:Drawings_by_children
- https://commons.wikimedia.org/wiki/File:A_child%27s_drawing_of_a_house_with_an_apple_tree.jpg
- https://www.kaggle.com/datasets/vishmiperera/children-drawings
- https://huggingface.co/datasets/6chan/children-hand-drawn-style-transfer
- https://www.mozillafoundation.org/en/common-voice/platform-and-dataset/
- https://librivox.org/bedtimestories-by-anonymous/

| Fixture                   | Input                                | V1 result                               | Desired result                                  | Failure type        | Manual work v1 forced                |
| ------------------------- | ------------------------------------ | --------------------------------------- | ----------------------------------------------- | ------------------- | ------------------------------------ |
| `clean-house-tree`        | Clean child drawing of house/tree    | Extracted palette and generic character | Infer house/tree scene, story should mention it | Wrong-but-confident | User names/describes obvious subject |
| `photo-shadow-paper`      | Phone photo with paper, desk, shadow | Treats background as drawing            | Crop/deskew paper, warn about shadows           | Silent wrongness    | User must retake/crop manually       |
| `toddler-sparse-smiley`   | Sparse toddler face/scribble         | Over-interprets sparse marks            | Low confidence, suggest correction              | Wrong-but-confident | User must notice weak inference      |
| `huge-story-cover`        | Large child-art/story-cover image    | Long decode with generic progress       | Size budget, progress, safe downscale           | Stuck-state risk    | User waits without control           |
| `multipage-art-pdf`       | Multi-page child-art PDF             | Unsupported image decode                | Explain PDF unsupported and next step           | Opaque failure      | User guesses what went wrong         |
| `low-contrast-sketch`     | Pale/white-on-white drawing          | Nearly empty palette/ink                | Low contrast warning, retake suggestion         | Silent poor output  | User diagnoses visibility            |
| `dataset-emotion-drawing` | Dataset drawing with emotion label   | Ignores visible/semantic emotion        | Cautious affect inference + confidence          | Feels generic       | User supplies story tone             |
| `mixed-subject-text`      | People/house/text in one drawing     | No subject hierarchy                    | Main subject vs background/text                 | App does not infer  | User chooses what matters            |
| `short-noisy-voice`       | Short/noisy read speech              | Weak profile accepted                   | Reject or warn with recording guidance          | Bad input accepted  | User discovers bad narration later   |
| `long-multispeaker-audio` | Long public bedtime audio            | No import path, no clear policy         | Explain mic-only v1 and multi-speaker issue     | Unsupported unclear | User does not know expected input    |

## Top 5 Logic Gaps

1. Drawing analysis sees pixels but not drawings: no paper crop, foreground separation, subject inference, or low-confidence fallback.
2. Story generation is insufficiently grounded in the drawing; it uses palette/mood more than visible content.
3. No confidence model exists, so weak guesses look as authoritative as strong guesses.
4. Voice profiling lacks quality gates for duration, silence, noise, clipping, and multi-speaker risk.
5. Errors are too technical or generic for unsupported formats, huge files, and partial/corrupt inputs.

## Top 3 Intuition Failures

1. A real photo of a drawing should auto-crop to the paper; v1 lets desk shadows become story input.
2. A recognizable drawing still requires the user to name the obvious subject.
3. Voice recording proceeds without saying whether the sample is good enough.

## Top 3 Feels-Stupid Moments

1. The app calls a house/tree drawing something abstract instead of "the little house by the tree."
2. The app accepts a too-short or noisy voice recording and only reveals the problem through weak narration.
3. A PDF or broken file produces a generic failure instead of a domain explanation.

## What Smart Means

- On first drawing input, infer paper/foreground quality, likely subject, scene type, confidence, and correction suggestions.
- Ground the first story draft in visible drawing elements, not only colors.
- Gate voice recordings with domain feedback before treating them as usable.
- Expose confidence and reasons for every meaningful inference.
- Make outputs deterministic and carry source/provenance metadata.

## Success Metrics

- At least 7 of 10 real-data fixtures complete drawing-to-story with no manual correction beyond personal fields.
- Main subject is correct or explicitly low-confidence on at least 8 of 10 fixtures.
- 100% of unsupported/broken inputs produce actionable what/why/now-what errors.
- Same fixture and options produce byte-identical story output, excluding explicit timestamps.
- Median drawing inference under 1s; p95 under 3s for inputs up to 5MB.
- Voice quality gate catches too-short, silent, and noisy recordings in fixture tests.
- Every inference used in UI has confidence and reasons.

## After Phase 2 Implementation

Fixture contract pass rate: 10/10. The app now either makes the expected useful first guess or produces an actionable domain failure for unsupported inputs.

| Fixture                   | Phase 2 result                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| `clean-house-tree`        | Infers house/tree with high confidence and grounds the story in it.  |
| `photo-shadow-paper`      | Labels drawing photo, flags shadow/crop risk, avoids high certainty. |
| `toddler-sparse-smiley`   | Keeps smiley face but lowers confidence and suggests adding a note.  |
| `huge-story-cover`        | Infers story cover and surfaces large-file guidance/cancel path.     |
| `multipage-art-pdf`       | Rejects PDF with what/why/next-step guidance.                        |
| `low-contrast-sketch`     | Labels faint drawing, flags sparse/low-contrast issues.              |
| `dataset-emotion-drawing` | Infers family subject with story hint.                               |
| `mixed-subject-text`      | Infers mixed family/house/text and asks the user to choose focus.    |
| `short-noisy-voice`       | Flags too-short, too-quiet, and noisy/thin quality.                  |
| `long-multispeaker-audio` | Rejects imported public audio with the mic-only v1 policy.           |

## Out Of Scope

- New backend, auth, sync, cloud AI, or exact neural voice cloning.
- New product surfaces, sharing/export expansion, dark mode, or polish-only work.
- Architecture mode changes.
- Claims that browser SpeechSynthesis is exact voice cloning.
