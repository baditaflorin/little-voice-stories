# 0063 - Half-Baked Feature Triage Decisions

- Status: accepted

## Context

Phase 3 audit found several partially-realized features that either needed finishing or removal.

## Decision

- Finish: reset safety, pause/resume narration, debug visibility, portable session handling, print/copy/export paths.
- Keep with clearer messaging: Local AI remains optional and capability-gated.
- Delete: unused React Query wrapper and dependency.
- Keep out of scope: external audio import and remote URL fetch.

## Consequences

- The visible UI should contain no production stubs after Phase 3.

## Alternatives Considered

- Hide everything incomplete without replacement: rejected because it would still leave the core workflow brittle.
