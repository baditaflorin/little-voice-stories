# Phase 3 Input Audit

Status key:

- `green`: works fully on current app state
- `yellow`: works partially or with important caveats
- `red`: missing, broken, or not wired
- `gray`: intentionally out of scope for Mode A v1

| Pathway                         | Status before Phase 3 | Status after Phase 3 | Notes                                                                                                |
| ------------------------------- | --------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| Single image upload             | `green`               | `green`              | File picker accepts drawings and routes straight into analysis.                                      |
| Drag and drop image             | `green`               | `green`              | Dropped image files analyze end to end.                                                              |
| Multi-file drop or picker       | `red`                 | `green`              | The first usable image is analyzed and the app explains when extra files were left unused.           |
| Mobile picker                   | `yellow`              | `green`              | The image input now includes a camera capture hint and still accepts Files/Photos selections.        |
| Paste image from clipboard      | `red`                 | `green`              | Window paste handling now accepts pasted screenshots or copied drawings.                             |
| Clipboard read button           | `red`                 | `green`              | Explicit read flow exists with permission fallback guidance.                                         |
| URL input                       | `red`                 | `gray`               | Still intentionally out of scope on GitHub Pages; README limitations now explain the CORS tradeoff.  |
| Restored autosave               | `green`               | `green`              | IndexedDB restore still works for the current project shape.                                         |
| Import saved state file         | `red`                 | `green`              | Portable session JSON imports restore drawing, story, voice profile, settings, and activity history. |
| Deep link restore               | `red`                 | `green`              | Story share links restore a lightweight session through the URL hash.                                |
| Demo/sample drawing             | `green`               | `green`              | Sample loader still works and remains equivalent to user-supplied paths.                             |
| Replace existing drawing        | `yellow`              | `green`              | The app now warns when a replacement drawing will overwrite the current one.                         |
| Voice recording from microphone | `green`               | `green`              | MediaRecorder path still works with recovery on permission denial.                                   |
| Import external audio           | `gray`                | `gray`               | Still intentionally out of scope; this release keeps the parent voice sample microphone-only.        |
| Folder input                    | `gray`                | `gray`               | Still intentionally out of scope for a single-session bedtime workflow.                              |

## Before vs After

- Before: Green 5 / Yellow 2 / Red 6 / Gray 2
- After: Green 12 / Yellow 0 / Red 0 / Gray 3

## Result

Phase 3 cleared every claimed input path except the ones deliberately kept out of scope for Mode A.
The app can now accept real drawings from the pathways a stranger is most likely to try first:
upload, drag-drop, paste, clipboard read, sample load, autosave restore, session import, and share-link restore.
