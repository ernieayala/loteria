import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { STATUS_CODES, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function end(res: ServerResponse, status: number): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(STATUS_CODES[status]);
}

/**
 * Serve the built web app from `root`.
 *
 * The request path is untrusted. A decoded `%2e%2e%2f` or `%5c` can climb out of `root` after
 * `path.resolve`, so every resolved file is checked to sit inside `root` before anything is read.
 * Vite fingerprints everything under `assets/`, so those cache forever; `index.html` never caches,
 * which is what makes a redeploy reach phones that already loaded the old page.
 */
export function staticHandler(root: string): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const base = path.resolve(root);
  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return end(res, 405);
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      return end(res, 400);
    }
    const file = path.resolve(base, '.' + (pathname.endsWith('/') ? `${pathname}index.html` : pathname));
    const rel = path.relative(base, file);
    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return end(res, 404);

    let size: number;
    try {
      const info = await stat(file);
      if (!info.isFile()) return end(res, 404);
      size = info.size;
    } catch {
      return end(res, 404);
    }
    res.writeHead(200, {
      'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
      'content-length': size,
      'cache-control': rel.startsWith(`assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') return void res.end();
    createReadStream(file)
      .on('error', () => res.destroy())
      .pipe(res);
  };
}
