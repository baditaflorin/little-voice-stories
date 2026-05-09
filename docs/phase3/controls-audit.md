# Phase 3 Controls Audit

Status key:

- `green`: control does what the label says end to end
- `yellow`: works, but important side effects or limitations are unclear
- `red`: stub, misleading, or incomplete

| Control                     | Status before Phase 3 | Notes                                                                                              |
| --------------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| Step tabs                   | `green`               | Navigation works.                                                                                  |
| Upload drawing              | `green`               | Opens file picker and analyzes one image.                                                          |
| Use sample                  | `green`               | Loads sample drawing.                                                                              |
| Cancel analysis             | `green`               | Aborts current analysis.                                                                           |
| Use inferred character name | `green`               | Applies the suggested subject-derived name.                                                        |
| Continue to story           | `yellow`              | Advances even if character fields are still empty defaults; no validation hint.                    |
| Compose story               | `green`               | Generates template story.                                                                          |
| Local AI                    | `yellow`              | Works only with WebGPU; failure mode is honest but the button offers no support copy before click. |
| Continue to voice           | `green`               | Advances once story exists.                                                                        |
| Record                      | `green`               | Starts microphone recording.                                                                       |
| Stop recording              | `green`               | Stops and analyzes voice sample.                                                                   |
| Demo voice                  | `green`               | Loads demo voice profile.                                                                          |
| Play story                  | `green`               | Starts narration.                                                                                  |
| Pause                       | `yellow`              | Pauses speech, but there is no resume button.                                                      |
| Stop narration              | `green`               | Cancels narration.                                                                                 |
| Reset local data            | `yellow`              | Clears project, but there is no confirmation or import/export safety prompt.                       |
| GitHub link                 | `green`               | Opens repository.                                                                                  |
| Support link                | `green`               | Opens PayPal.                                                                                      |

## Controls needing action

1. `Pause` needs a matching resume path or it is incomplete.
2. `Reset local data` should warn when work is about to be discarded.
3. `Continue to story` should validate the remaining required user fields more clearly.
4. `Local AI` should explain capability requirements before a user hits the error path.
