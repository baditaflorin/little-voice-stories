import { rmSync } from 'node:fs';

for (const path of [
  'docs/assets',
  'docs/index.html',
  'docs/404.html',
  'docs/manifest.webmanifest',
  'docs/sw.js',
  'docs/version.json',
]) {
  rmSync(path, { force: true, recursive: true });
}
