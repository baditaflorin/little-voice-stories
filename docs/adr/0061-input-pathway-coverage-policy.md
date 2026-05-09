# 0061 - Input Pathway Coverage Policy

- Status: accepted

## Context

The app only supported upload, drag-drop, and a sample path. Parents commonly work from screenshots, copied images, and repeated attempts with several files.

## Decision

Support these input pathways in the shipped app:

- single-file upload
- drag-drop
- paste image
- clipboard read button
- multi-file selection with first-success handling
- import session JSON
- autosave restore
- share-link restore

Explicitly leave external audio import and arbitrary remote URL fetch out of scope, with clear copy explaining why.

## Consequences

- The UI needs discoverable import and paste controls.
- Validation and recovery must exist at each boundary.

## Alternatives Considered

- Keep only upload and sample: rejected as not stranger-usable.
