# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Users need to keep a draft story, drawing preview, and parent voice profile without accounts or cloud sync.

## Decision

Use IndexedDB through the `idb` library. Store compressed drawing previews, story text, voice-profile measurements, and lightweight project metadata. Store raw parent recordings only when the user explicitly chooses to keep them.

## Consequences

- Data stays on the device.
- Storage survives refresh and PWA relaunch.
- Cross-device sync is not available in v1.

## Alternatives Considered

- `localStorage`: too small and synchronous for media.
- OPFS: powerful, but IndexedDB has better broad-browser ergonomics for v1.
- Server database: rejected by ADR 0001.
