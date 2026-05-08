import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number.parseInt(process.env.PORT ?? '4317', 10);
const basePath = '/little-voice-stories/';
const docsRoot = join(process.cwd(), 'docs');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
  if (!requestUrl.pathname.startsWith(basePath)) {
    response.writeHead(302, { Location: basePath });
    response.end();
    return;
  }

  const relative = requestUrl.pathname.slice(basePath.length) || 'index.html';
  const safeRelative = normalize(relative).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(docsRoot, safeRelative);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }
  if (!existsSync(filePath)) {
    filePath = join(docsRoot, '404.html');
  }

  response.writeHead(filePath.endsWith('404.html') ? 404 : 200, {
    'Cache-Control': 'no-store',
    'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Pages preview: http://127.0.0.1:${port}${basePath}`);
});
