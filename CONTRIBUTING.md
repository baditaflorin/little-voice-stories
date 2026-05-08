# Contributing

Thanks for helping make bedtime softer for families who travel.

## Local Setup

```bash
npm install
make install-hooks
make test
make build
make smoke
```

Use Conventional Commits for every commit, for example `feat: add drawing digitizer`.

## Pull Request Expectations

- Keep changes focused.
- Add or update tests for user-visible behavior.
- Do not commit secrets, `.env` files, generated logs, or private audio/image data.
- Run `make lint test build smoke` before publishing a branch.
