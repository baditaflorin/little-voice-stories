# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project does not use GitHub Actions, so local hooks carry the quality gates.

## Decision

Use plain `.githooks/` scripts wired with `git config core.hooksPath .githooks` via `make install-hooks`.

Hooks:

- `pre-commit`: lint, typecheck, format check, unit tests, and `gitleaks protect --staged`.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, and `make smoke`.

## Consequences

- Contributors can run the same checks manually through Make targets.
- `gitleaks` must be installed locally before committing with hooks enabled.

## Alternatives Considered

- Lefthook: good option, but plain hooks avoid another config dependency.
