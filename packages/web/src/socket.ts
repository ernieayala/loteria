/**
 * One WebSocket to the server that keeps coming back.
 *
 * Phones drop sockets whenever the screen locks. The socket retries with backoff, and retries at
 * once when the page becomes visible again, so a player who glances away misses nothing: the page
 * sends `resume` on every open and the server answers with the whole current view.
 */

import { ServerMessageSchema, type ClientMessage, type ServerMessage } from '@loteria/core';

export interface SocketHandlers {
  onOpen(): void;
  onClose(): void;
  onMessage(message: ServerMessage): void;
}

export interface GameSocket {
  /** Send if the socket is open. Returns false when it is not, so the caller can say so. */
  send(message: ClientMessage): boolean;
  /** Drop the current connection and its seat, then reconnect fresh. */
  restart(): void;
}

const MAX_BACKOFF_MS = 8000;

export function openSocket(handlers: SocketHandlers): GameSocket {
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  let ws: WebSocket;
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  function open(): void {
    clearTimeout(retryTimer);
    ws = new WebSocket(url);
    ws.onopen = () => {
      attempt = 0;
      handlers.onOpen();
    };
    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      let data: unknown;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.error('[loteria] server sent non-JSON', event.data);
        return;
      }
      const parsed = ServerMessageSchema.safeParse(data);
      if (parsed.success) handlers.onMessage(parsed.data);
      else console.error('[loteria] server sent an unknown message', parsed.error);
    };
    ws.onclose = () => {
      handlers.onClose();
      retryTimer = setTimeout(open, Math.min(1000 * 2 ** attempt++, MAX_BACKOFF_MS));
    };
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ws.readyState === WebSocket.CLOSED) open();
  });
  open();

  return {
    send(message) {
      if (ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(message));
      return true;
    },
    restart() {
      ws.onclose = null;
      ws.close();
      handlers.onClose();
      open();
    },
  };
}
