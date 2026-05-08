# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A deploys only to GitHub Pages.

## Decision

Use GitHub Pages only. There is no `deploy/` directory, Docker Compose stack, nginx config, backend process, Prometheus endpoint, or server runbook in v1.

## Consequences

- Deployment is a git push to `main` after `make build`.
- Rollback is a revert of the commit that changed `docs/`.

## Alternatives Considered

- Docker backend plus Pages frontend: rejected by ADR 0001.
