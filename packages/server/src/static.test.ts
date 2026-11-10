import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer, get, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { staticHandler } from './static.js';

let dir: string;
let server: Server;
let port: number;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'loteria-static-'));
  const root = path.join(dir, 'build');
  await mkdir(path.join(root, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<h1>tabla</h1>');
  await writeFile(path.join(root, 'assets', 'app-abc123.js'), 'console.log(1)');
  // A file beside the web root that no request may reach.
  await writeFile(path.join(dir, 'secret.txt'), 'token');
  const handler = staticHandler(root);
  server = createServer((req, res) => void handler(req, res));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(dir, { recursive: true, force: true });
});

/** Raw GET: node:http sends the path as written, where fetch would normalize the dots away. */
function request(rawPath: string): Promise<{ status: number; body: string; cache: string | undefined }> {
  return new Promise((resolve, reject) => {
    get({ port, path: rawPath }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => (body += chunk.toString()));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body, cache: res.headers['cache-control'] }));
    }).on('error', reject);
  });
}

describe('staticHandler', () => {
  it('serves index.html at / without caching it', async () => {
    expect(await request('/')).toEqual({ status: 200, body: '<h1>tabla</h1>', cache: 'no-cache' });
  });

  it('serves a fingerprinted asset with a long cache', async () => {
    const res = await request('/assets/app-abc123.js');
    expect(res.status).toBe(200);
    expect(res.cache).toBe('public, max-age=31536000, immutable');
  });

  it('returns 404 for a missing file and for a directory', async () => {
    expect((await request('/nope.js')).status).toBe(404);
    expect((await request('/assets')).status).toBe(404);
  });

  it.each([
    '/../secret.txt',
    '/%2e%2e/secret.txt',
    '/%2e%2e%2fsecret.txt',
    '/assets/..%2f..%2fsecret.txt',
    '/..%5csecret.txt',
    '/%00',
  ])('never serves outside the root for %s', async (rawPath) => {
    const res = await request(rawPath);
    expect(res.status).not.toBe(200);
    expect(res.body).not.toContain('token');
  });

  it('answers a malformed escape with 400', async () => {
    expect((await request('/%E0%A4%A')).status).toBe(400);
  });
});
