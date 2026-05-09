# Phase 3 Findings

## Top 5 Usability Gaps

1. A stranger can create a story, but cannot export, share, print, or restore it as a user-controlled artifact.
2. There is no paste or clipboard path for the most common "I already have a screenshot/photo" workflow.
3. Reset and pause are incomplete: reset gives no safety rail, and pause has no resume.
4. Settings are implicit or hidden in code and query params instead of discoverable in the product.
5. The app restores one browser session, but not a portable saved session.

## Top 5 Half-Baked Features

1. PWA/installability: finish enough to explain it in the UI.
2. Debug surface: keep, but make it discoverable through settings instead of magic query only.
3. Speech pause: finish with resume.
4. Reset local data: finish with confirmation and safer copy.
5. React Query wrapper: delete because it is not powering anything.

## Top 5 Codebase Pain Points

1. `ProjectWorkspace.tsx` is carrying too many responsibilities.
2. Persistence has no migration policy for future saved-state changes.
3. Input and output pathways are thin, so tests only prove the curated path.
4. Capability-dependent features such as WebGPU are not explained until a click fails.
5. There is no canonical portable project format.

## Top 5 Documentation / Reality Mismatches

1. README describes a usable local studio, but there is no save-file export/import.
2. PWA status is technically true but not discoverable by a normal user.
3. Privacy docs mention reset, but not how to preserve work before reset.
4. Phase 2 docs emphasize real-user readiness, but stranger-style import/export paths are still absent.
5. The published app shows debug data only with a hidden query flag.

## Fully Usable Means

1. A parent can load a drawing from upload, drag-drop, or paste, create a story, and export it without asking what button to press next.
2. A parent can save a bedtime session to a file, reload the page later, and import the session back with no data loss.
3. A parent can print or copy the bedtime story for a partner, caregiver, or offline fallback.
4. A parent can understand why Local AI or voice recording is unavailable and still finish the session through a supported fallback.
5. A parent can recover from mistakes: reset, replace, import, and share are all intentional and explained.

## Phase 3 Success Metrics

- Input audit reaches at least `8` green rows, with remaining non-green rows explicitly documented as out of scope.
- Output audit reaches at least `8` green rows.
- Every visible production control is either green or removed.
- Portable session export/import round-trip works in automated tests.
- README feature list is updated so every claim is true in the shipped app.
- Stranger test finds no end-to-end blocker on the main workflow.

## Out Of Scope

- New AI or model capabilities beyond the locked Phase 2 engine.
- Cloud sync, backend storage, or neural voice cloning.
- Pure polish work such as theming, animation-only changes, or marketing surfaces.
