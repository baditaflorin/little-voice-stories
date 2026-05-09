# 0043 - Domain Vocabulary And UI Language

## Status

Accepted

## Context

Users think in drawings, characters, bedtime stories, and parent voice, not parser internals.

## Decision

Use domain language in UI and errors: drawing, subject, story hint, confidence, voice sample, too quiet, too short, retake, and continue knowingly.

## Consequences

Error and inference copy must state what happened, why, and what the user can do next.

## Alternatives Considered

Technical errors were rejected except inside debug surfaces.
