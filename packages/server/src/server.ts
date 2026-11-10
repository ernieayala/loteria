import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import type { ViteDevServer } from 'vite';
import { attachHub } from './hub.js';
import { staticHandler } from './static.js';

const WEB_ROOT = fileURLToPath(new URL('../../web/', import.meta.url));
export const SOCKET_PATH = '/ws';
const MAX_MESSAGE_BYTES = 4 * 1024;

export interface ServerOptions {
  readonly port: number;
  /** Serve the web app through Vite with hot reload instead of from its `build/` folder. */
  readonly dev: boolean;
}

export interface RunningServer {
  readonly port: number;
  close(): Promise<void>;
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

/**
 * One HTTP server for everything: the page, the health check, and the game socket. A single port
 * means one address to hand round the table, and in dev the phones get hot reload too.
 */
export async function startServer({ port, dev }: ServerOptions): Promise<RunningServer> {
  let app: Handler = staticHandler(path.join(WEB_ROOT, 'build'));
  const http = createServer((req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
      return;
    }
    void app(req, res);
  });

  let vite: ViteDevServer | undefined;
  if (dev) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      root: WEB_ROOT,
      appType: 'spa',
      server: { middlewareMode: true, hmr: { server: http } },
    });
    app = vite.middlewares;
  }

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
  const hub = attachHub(wss);
  http.on('upgrade', (req, socket, head) => {
    if (new URL(req.url ?? '/', 'http://localhost').pathname === SOCKET_PATH) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
      // In dev, Vite's HMR socket shares this server and answers its own upgrades.
    } else if (!dev) {
      socket.destroy();
    }
  });

  await new Promise<void>((resolve, reject) => {
    http.once('error', reject);
    http.listen(port, () => resolve());
  });

  return {
    port: (http.address() as AddressInfo).port,
    async close() {
      hub.close();
      for (const ws of wss.clients) ws.terminate();
      wss.close();
      await vite?.close();
      http.closeAllConnections();
      await new Promise<void>((resolve) => http.close(() => resolve()));
    },
  };
}
