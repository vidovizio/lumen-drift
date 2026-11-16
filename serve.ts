import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'game');
const defaultPort = 8080;
const args = process.argv.slice(2);
const portArg = args.find((arg) => arg.startsWith('--port='));
const portIndex = args.indexOf('--port');
const explicitPort = portArg ? Number.parseInt(portArg.split('=')[1], 10) : portIndex >= 0 ? Number.parseInt(args[portIndex + 1] ?? '', 10) : NaN;
const port = Number.isFinite(explicitPort) ? explicitPort : defaultPort;

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function safePath(requestPath: string) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = normalize(decoded).replace(/^\\.\.?[\\/]+/, '');
  const target = resolve(root, '.' + normalized.replace(/^\//, '/'));
  if (!target.startsWith(root)) return null;
  return target;
}

function serveFile(res: ServerResponse, filePath: string) {
  const extension = extname(filePath).toLowerCase();
  const contentType = types[extension] ?? 'application/octet-stream';
  try {
    const data = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Missing URL');
    return;
  }
  const url = new URL(req.url, `http://localhost:${port}`);
  let filePath = safePath(url.pathname);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  if (url.pathname === '/' || url.pathname === '') {
    filePath = join(root, 'index.html');
  } else if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  serveFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Serving http://localhost:${port}`);
});
