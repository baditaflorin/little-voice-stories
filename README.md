# Little Voice Stories

![Deployment](https://img.shields.io/badge/deployment-GitHub%20Pages-0f766e)
![Mode](https://img.shields.io/badge/mode-static%20PWA-1d4ed8)
![Privacy](https://img.shields.io/badge/analytics-none-111827)

Live app: https://baditaflorin.github.io/little-voice-stories/

Repository: https://github.com/baditaflorin/little-voice-stories

Support: https://www.paypal.com/paypalme/florinbadita

Little Voice Stories turns a kid's drawing into a bedtime character, writes a cozy story locally,
and narrates it with a private parent voice profile for nights when work travel gets in the way.

![Little Voice Stories screenshot](https://raw.githubusercontent.com/baditaflorin/little-voice-stories/main/docs/screenshot.png)

## Quickstart

```bash
npm install
make dev
make test
make build
make pages-preview
```

## What The App Does Today

- Digitizes a kid drawing in-browser with canvas color, edge, and coverage analysis.
- Accepts drawings from upload, drag-drop, paste, clipboard read, and a built-in sample.
- Turns the drawing into a named character seed with palette, mood, gift, and bedtime challenge.
- Generates a full bedtime story locally with a deterministic story engine.
- Offers an optional WebGPU/WebLLM local AI story path after explicit user action.
- Records around 30 seconds of parent audio and creates a local voice profile.
- Narrates the story with browser SpeechSynthesis tuned by the parent voice profile.
- Saves the current project in IndexedDB and can export or re-import the full session as JSON.
- Copies story text or JSON, creates a story share link, and prints a clean bedtime-friendly page.
- Exposes session settings for autosave, learned subject corrections, debug state, and story defaults.
- Works as an installable PWA and shows the published version and commit in the live UI.

The app intentionally uses a privacy-preserving parent voice imprint instead of claiming exact neural
voice cloning. The app has no backend and no analytics.

## Limitations

- Voice input is microphone-only in `0.3.x`; importing external audio files is still out of scope.
- URL-based drawing import is intentionally not built because GitHub Pages cannot solve arbitrary image CORS safely.
- The optional Local AI path needs a modern browser with WebGPU. Template story generation remains available everywhere else.

## Architecture

```mermaid
flowchart LR
  Parent["Traveling parent"] --> App["React PWA on GitHub Pages"]
  Child["Child"] --> App
  App --> Canvas["Canvas drawing analyzer"]
  App --> Story["Local story engine"]
  App -. optional .-> WebLLM["WebLLM/WebGPU model"]
  App --> Voice["MediaRecorder + SpeechSynthesis"]
  App --> IDB["IndexedDB local project"]
```

Architecture docs: https://github.com/baditaflorin/little-voice-stories/blob/main/docs/architecture.md

ADRs: https://github.com/baditaflorin/little-voice-stories/tree/main/docs/adr

Deploy guide: https://github.com/baditaflorin/little-voice-stories/blob/main/docs/deploy.md

Privacy notes: https://github.com/baditaflorin/little-voice-stories/blob/main/docs/privacy.md

Postmortem: https://github.com/baditaflorin/little-voice-stories/blob/main/docs/postmortem.md

## Local Checks

```bash
make lint
make test
make build
make smoke
```

Install local hooks:

```bash
make install-hooks
```
