import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

function gitValue(command: string, fallback: string) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

const appVersion = process.env.VITE_APP_VERSION ?? pkg.version;
const gitCommit = process.env.VITE_GIT_COMMIT ?? gitValue('git rev-parse --short HEAD', 'local');
const gitBranch = process.env.VITE_GIT_BRANCH ?? gitValue('git branch --show-current', 'main');

export default defineConfig({
  base: '/little-voice-stories/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mlc-ai/web-llm')) {
            return 'local-llm';
          }
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
