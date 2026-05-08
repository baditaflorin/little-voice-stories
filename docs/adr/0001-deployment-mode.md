# 0001 - Deployment Mode

## Status

Accepted

## Context

Little Voice Stories handles child drawings and parent voice recordings. The safest v1 deployment is one where private media does not leave the user's browser. GitHub Pages is the preferred public surface.

## Decision

Use Mode A: Pure GitHub Pages.

The app is a static PWA served from `main:/docs` at https://baditaflorin.github.io/little-voice-stories/. Drawing analysis, story generation, voice recording, voice-profile analysis, narration playback, and persistence run in browser APIs, Web Workers where useful, IndexedDB, and optional lazy client-side AI modules.

## Consequences

- No runtime server, no server logs, no backend secrets, and no account system.
- The v1 AI quality is bounded by browser support, asset size, and local compute.
- Exact neural parent voice cloning is not claimed in v1. V1 ships a local parent voice profile that drives narration pitch, pace, volume, and voice selection.
- GitHub Pages cannot set COOP/COEP headers, so WASM/WebGPU modules must work without relying on custom response headers or must be lazy experimental features.

## Alternatives Considered

- Mode B: Not needed because v1 does not depend on prebuilt datasets.
- Mode C: Rejected for v1 because a backend would increase privacy risk and operational scope without being required for the local happy path.
