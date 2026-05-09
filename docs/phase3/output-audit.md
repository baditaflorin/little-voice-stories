# Phase 3 Output Audit

Status key:

- `green`: works fully on current app state
- `yellow`: works partially or with important caveats
- `red`: missing, broken, or not wired
- `gray`: intentionally out of scope for Mode A v1

| Pathway                     | Status before Phase 3 | Notes                                                                     |
| --------------------------- | --------------------- | ------------------------------------------------------------------------- |
| Story visible in UI         | `green`               | Story can be read and edited in the browser.                              |
| Browser narration playback  | `green`               | SpeechSynthesis path works once story and voice profile exist.            |
| Copy story to clipboard     | `red`                 | No copy action exists.                                                    |
| Download story as text      | `red`                 | No text export exists.                                                    |
| Download project state file | `red`                 | No state export exists.                                                   |
| Re-import exported state    | `red`                 | No import route exists.                                                   |
| Shareable URL               | `red`                 | No deep-link export exists.                                               |
| Printable bedtime view      | `red`                 | No print action or print-specific layout exists.                          |
| Copy structured JSON        | `red`                 | No JSON export or clipboard path exists.                                  |
| Version and commit visible  | `green`               | Visible in the header and published bundle.                               |
| Debug/provenance inspection | `yellow`              | `?debug=1` works, but there is no discoverable UI path.                   |
| Screenshot-friendly output  | `yellow`              | The story is visible, but there is no dedicated print or story-card mode. |

## Baseline

- Green: 3
- Yellow: 2
- Red: 7

## Highest-impact output gaps

1. A parent cannot take their work out of the app except by reading it onscreen.
2. There is no full-state export/import round-trip.
3. There is no quick copy path for the story text.
4. There is no share or print mode for bedtime handoff.
5. Debug/provenance exists but is effectively hidden.
