# 0062 - Output Pathway Coverage Policy

- Status: accepted

## Context

Users could create a bedtime story but had no good way to take it out of the app or restore it later.

## Decision

Ship these output pathways:

- copy story text
- download story text
- copy project JSON
- download portable project JSON
- shareable URL snapshot for reasonably small sessions
- print view

Full binary voice export remains out of scope because the product stores analyzed voice settings rather than raw microphone data.

## Consequences

- The app needs a canonical portable project schema and migration policy.
- Share URLs need explicit size limits and fallback messaging.

## Alternatives Considered

- Add no output features and rely on autosave: rejected as fragile and user-hostile.
