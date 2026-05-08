# 0006 - WASM And Local AI Modules

## Status

Accepted

## Context

The prompt asks for local LLM behavior. Browser-side model loading can be large and hardware-dependent, especially on GitHub Pages where custom headers are unavailable.

## Decision

Ship a deterministic local story weaver as the default path and offer an experimental WebLLM path lazy-loaded only after the user opts in. The WebLLM model choice is intentionally small and can change behind the same interface.

No WASM module is required for the default happy path. WebLLM/WebGPU is optional and best-effort.

## Consequences

- The app works quickly without model downloads.
- Users with WebGPU can try local LLM generation without data leaving the browser.
- The default feature set remains below the initial payload budget.

## Alternatives Considered

- Bundle an LLM model with the app: rejected because it would violate the asset budget.
- Backend LLM API: rejected because it would require secrets or user data transfer.
