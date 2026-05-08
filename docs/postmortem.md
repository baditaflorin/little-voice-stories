# Postmortem

## What Was Built

Little Voice Stories v0.1.0 is a static GitHub Pages PWA at https://baditaflorin.github.io/little-voice-stories/.

It includes drawing upload/sample loading, canvas-based drawing analysis, character seed generation, local bedtime story generation, optional lazy WebLLM generation, parent microphone recording, local voice-profile analysis, SpeechSynthesis narration, IndexedDB persistence, version/commit display, GitHub and PayPal links, local hooks, unit tests, and Playwright smoke coverage.

## Was Mode A Correct?

Yes. Mode A was the right v1 choice.

The app handles child drawings and parent voice samples, so avoiding a server is a major privacy win. The happy path works without accounts, backend secrets, server storage, or runtime APIs. A backend would mainly help with higher-quality neural voice cloning, but that would also move sensitive parent voice data into a more complex trust model.

## What Worked

- GitHub Pages from `main:/docs` was simple and visible from the first push.
- The deterministic story engine gives a fast local fallback when WebGPU or model downloads are unavailable.
- IndexedDB is enough for the current single-device project state.
- The Playwright smoke test caught a real local port collision and led to a project-specific preview port.

## What Did Not Work

- Exact local neural voice cloning is not practical in this v1 static browser budget.
- WebLLM adds a large lazy chunk. It keeps the initial payload under budget, but the optional local AI path is still heavy.
- GitHub Pages cannot set COOP/COEP headers, which limits some future browser AI/runtime choices.

## What Surprised Us

The biggest surprise was how easy it is for a local smoke test to pass against the wrong static site when several Pages projects share a preview port. The preview server now defaults to `4317`.

## Accepted Tech Debt

- UI components are intentionally simple and can be split further as the app grows.
- The voice profile maps parent audio characteristics to SpeechSynthesis controls; it is not a neural clone.
- WebLLM errors are surfaced to the user, but model compatibility is best-effort.

## Next Three Improvements

1. Add a downloadable bedtime session package with story text, drawing preview, and voice-profile settings.
2. Explore a browser-feasible local TTS model that supports speaker embeddings without sending voice data away.
3. Add multiple saved stories and a small bedtime library view in IndexedDB.

## Time Spent Vs Estimate

Estimate: one focused implementation session for a static v1 prototype.

Actual: roughly one focused implementation session. The main extra time went into making Pages preview and smoke tests robust around the GitHub Pages base path.
