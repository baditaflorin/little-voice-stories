# Phase 3 Input Audit

Status key:

- `green`: works fully on current app state
- `yellow`: works partially or with important caveats
- `red`: missing, broken, or not wired
- `gray`: intentionally out of scope for Mode A v1

| Pathway                         | Status before Phase 3 | Notes                                                                                      |
| ------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| Single image upload             | `green`               | File picker accepts one drawing and runs analysis end to end.                              |
| Drag and drop image             | `green`               | First dropped image is analyzed. No per-file feedback.                                     |
| Multi-file drop or picker       | `red`                 | Extra files are ignored; no queue, progress, or partial success.                           |
| Mobile picker                   | `yellow`              | Native file picker works, but there is no camera capture hint or mobile-specific guidance. |
| Paste image from clipboard      | `red`                 | No paste listener, no explicit clipboard path, no fallback message.                        |
| Clipboard read button           | `red`                 | No read-permission flow exists.                                                            |
| URL input                       | `red`                 | No URL input or honest CORS guidance exists.                                               |
| Restored autosave               | `green`               | IndexedDB restore works for current project shape.                                         |
| Import saved state file         | `red`                 | No import route exists.                                                                    |
| Deep link restore               | `red`                 | No URL-hash or query-state restore path exists.                                            |
| Demo/sample drawing             | `green`               | Sample loader works.                                                                       |
| Replace existing drawing        | `yellow`              | New upload replaces current drawing, but the UI does not explain overwrite behavior.       |
| Voice recording from microphone | `green`               | MediaRecorder path works with recovery on permission denial.                               |
| Import external audio           | `gray`                | Explicitly out of scope in Phase 2; v1 supports mic-only parent samples.                   |
| Folder input                    | `gray`                | Not appropriate for this single-story workflow.                                            |

## Baseline

- Green: 5
- Yellow: 2
- Red: 6
- Gray: 2

## Highest-impact input gaps

1. No paste or clipboard path for parents working from screenshots or copied drawings.
2. No import path for a previously saved bedtime session.
3. No multi-file handling or per-file feedback when users try more than one drawing.
4. No deep-link restore or share entry point.
5. No in-app explanation for why URL import and external audio import are out of scope.
