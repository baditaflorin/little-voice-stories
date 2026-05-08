.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@printf "%s\n" \
		"make install-hooks     Wire local git hooks" \
		"make dev               Run the frontend dev server" \
		"make build             Build GitHub Pages output into docs/" \
		"make data              No-op for Mode A" \
		"make test              Run unit tests" \
		"make test-integration  Run integration tests" \
		"make smoke             Run Playwright smoke tests" \
		"make lint              Run linters and type checks" \
		"make fmt               Format files" \
		"make pages-preview     Serve docs/ like GitHub Pages" \
		"make release           Tag the current commit" \
		"make clean             Remove generated local artifacts"

install-hooks:
	git config core.hooksPath .githooks

dev:
	npm run dev

build:
	npm run build

data:
	@echo "Mode A: no offline data pipeline."

test:
	npm run test

test-integration:
	@echo "No separate integration suite for Mode A v1."

smoke:
	npm run smoke

lint:
	npm run typecheck
	npm run lint
	npm run fmt:check

fmt:
	npm run fmt

pages-preview:
	npm run pages:preview

release:
	git tag v$$(node -p "require('./package.json').version")

clean:
	rm -rf docs/assets docs/index.html docs/404.html docs/manifest.webmanifest docs/sw.js docs/version.json coverage tmp test-results playwright-report

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	.githooks/commit-msg .git/COMMIT_EDITMSG

hooks-pre-push:
	.githooks/pre-push
