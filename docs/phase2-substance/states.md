# Phase 2 State Taxonomy

## Drawing States

- `idle-empty`: no drawing loaded. Exit: upload or sample.
- `loading-decodable`: file accepted and decode in progress. Exit: finish or cancel.
- `loaded-confident`: subject and quality confidence are acceptable. Exit: continue or correct.
- `loaded-low-confidence`: drawing loaded but subject or quality is weak. Exit: correct, retake, continue knowingly, or reset.
- `error-recoverable`: unsupported file, low contrast, corrupt input, or decode failure. Exit: choose another file or sample.
- `cancelled`: prior drawing remains intact. Exit: upload again, sample, or continue with prior drawing.

## Story States

- `not-ready`: missing drawing or character name. Exit: add drawing/name.
- `ready`: enough information to generate. Exit: compose local story or optional local AI.
- `generating`: story generation running. Exit: finish or fail.
- `generated-confident`: story has provenance and inferred subject grounding. Exit: edit or continue.
- `generated-low-confidence`: story exists but drawing confidence is low. Exit: edit/correct subject or continue knowingly.

## Voice States

- `idle`: no voice profile. Exit: record or demo voice.
- `recording`: microphone active. Exit: stop.
- `analyzing`: audio decode/quality profile running. Exit: success or recoverable error.
- `profile-usable`: quality score is acceptable. Exit: play narration or re-record.
- `profile-warning`: profile exists but has warnings. Exit: re-record, demo, or continue knowingly.
- `narrating`: SpeechSynthesis running. Exit: pause or stop.

## Global States

- `persisted`: IndexedDB save succeeded.
- `save-recoverable-error`: local save failed; current in-memory state remains.
- `debug-visible`: `?debug=1` shows internal state, confidence, provenance, and activity.
