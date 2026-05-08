# Deployment

Live app: https://baditaflorin.github.io/little-voice-stories/

Repository: https://github.com/baditaflorin/little-voice-stories

## Publishing

GitHub Pages is configured to serve `main:/docs`.

```bash
npm install
make test
make build
git add docs package-lock.json package.json src public scripts
git commit -m "feat: update published app"
git push origin main
```

## Rollback

Revert the commit that changed `docs/`, then push `main`.

```bash
git revert <commit_sha>
git push origin main
```

## Custom Domains

No custom domain is configured in v1. If one is added later, place a `CNAME` file in `docs/` and configure DNS with a CNAME to `baditaflorin.github.io`.
