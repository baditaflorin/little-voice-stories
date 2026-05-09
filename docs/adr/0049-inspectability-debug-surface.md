# 0049 - Inspectability And Debug Surface

## Status

Accepted

## Context

Confidence, reasons, and provenance need to be visible for support and power users.

## Decision

Add a `?debug=1` surface showing current drawing inference, story provenance, voice profile, and activity history.

## Consequences

Support can inspect behavior without adding remote logging or analytics.

## Alternatives Considered

Remote diagnostics were rejected by the privacy model.
