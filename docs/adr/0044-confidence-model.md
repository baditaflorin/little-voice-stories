# 0044 - Confidence Model

## Status

Accepted

## Context

V1 produced weak guesses with the same apparent certainty as strong guesses.

## Decision

Every drawing and voice inference receives a confidence score from 0 to 1, a label, and reasons. Scores below 0.55 are surfaced as low confidence and produce suggestions.

## Consequences

The UI can remain helpful without being confidently wrong.

## Alternatives Considered

Hiding confidence was rejected because it makes real-data failures feel dishonest.
