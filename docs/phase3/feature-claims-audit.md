# Phase 3 Feature Claims Audit

| Claim source                                                                                                             | Claim                                        | Status before Phase 3 | Notes                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| [README.md](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-2-kid-drawing/README.md:20)                  | "Saves the current project in IndexedDB"     | `shipped fully`       | Works for the current project shape.                                                                    |
| [README.md](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-2-kid-drawing/README.md:20)                  | "Works as an installable PWA"                | `shipped partially`   | Manifest and service worker exist, but the app does not expose any in-app install or offline guidance.  |
| [README.md](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-2-kid-drawing/README.md:15)                  | "Narrated in a private parent voice profile" | `shipped partially`   | Honest profile-guided narration exists, but there is no export/import path for the profile or settings. |
| [README.md](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-2-kid-drawing/README.md:19)                  | "Optional WebGPU/WebLLM local AI story path" | `shipped fully`       | Works when hardware supports it.                                                                        |
| [docs/postmortem.md](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-2-kid-drawing/docs/postmortem.md:7) | "Smoke coverage"                             | `shipped fully`       | Existing Playwright smoke test passes the happy path.                                                   |
| [docs/privacy.md](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-2-kid-drawing/docs/privacy.md:26)      | "Use the in-app reset control"               | `shipped fully`       | Reset button exists.                                                                                    |
| README by omission                                                                                                       | A user can take their work out of the app    | `not shipped`         | No export or share path exists.                                                                         |
| README by omission                                                                                                       | A user can bring a saved session back in     | `not shipped`         | No import path exists.                                                                                  |

## Highest-priority mismatches

1. PWA/installability is technically present but not practically discoverable.
2. The app can create a bedtime story, but it cannot hand it off cleanly through export, print, or share.
3. Persistence exists for one browser session but not as a user-controlled saved artifact.
