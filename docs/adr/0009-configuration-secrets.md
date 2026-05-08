# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

The frontend must never contain secrets. Build-time metadata is still useful for showing version and commit.

## Decision

Use Vite build-time constants for non-secret metadata only:

- app version
- git commit
- git branch
- build timestamp

Document placeholders in `.env.example`. Real `.env*` files are gitignored.

## Consequences

- The public app can show version and commit safely.
- There are no API keys, tokens, or private hostnames in the frontend.

## Alternatives Considered

- Runtime config endpoint: rejected because there is no backend.
- Encrypted frontend secrets: rejected because client-side secrets are not secret.
