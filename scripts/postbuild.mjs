import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

copyFileSync('docs/index.html', 'docs/404.html');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

function gitValue(command, fallback) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
}

writeFileSync(
  'docs/version.json',
  `${JSON.stringify(
    {
      version: process.env.VITE_APP_VERSION ?? pkg.version,
      commit: process.env.VITE_GIT_COMMIT ?? gitValue('git rev-parse --short HEAD', 'local'),
      branch: process.env.VITE_GIT_BRANCH ?? gitValue('git branch --show-current', 'main'),
      builtAt: new Date().toISOString(),
      repository: 'https://github.com/baditaflorin/little-voice-stories',
      support: 'https://www.paypal.com/paypalme/florinbadita',
    },
    null,
    2,
  )}\n`,
);
