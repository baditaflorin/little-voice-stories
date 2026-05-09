# 0041 - Input Robustness And Normalization Policy

## Status

Accepted

## Context

Users upload phone photos, SVGs, large files, low-contrast scans, unsupported PDFs, and partial or corrupt files.

## Decision

Validate file type and size before decode. Normalize drawing signals into bounded metrics: ink coverage, colorfulness, brightness, edge energy, palette, aspect ratio, and source metadata. Reject PDFs and non-images with actionable domain errors.

## Consequences

Errors happen at the boundary, and the app avoids pretending unsupported files are valid drawings.

## Alternatives Considered

Trying every file in canvas first was rejected because it creates opaque decode errors.
