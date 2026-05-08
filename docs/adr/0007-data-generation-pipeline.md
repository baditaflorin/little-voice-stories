# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B projects use data-generation pipelines. This project is Mode A.

## Decision

Do not create a data pipeline in v1. `make data` is a documented no-op.

## Consequences

- There are no generated JSON, Parquet, or SQLite datasets to version.
- Future curated prompt packs or model manifests would require a new ADR before adding a pipeline.

## Alternatives Considered

- Prebuilt prompt catalog: deferred because v1 can generate story structure locally.
