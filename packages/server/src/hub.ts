/**
 * The WebSocket side: parse each inbound message, apply it to its room's game, and push every seat
 * in that room its fresh view.
 *
 * Every change sends each seat its whole view rather than a delta. A view is a few hundred bytes,
 * and a phone that missed messages while asleep is correct again on the next one.
 */

import { randomUUID } from 'node:crypto';
import { WebSocket, type WebSocketServer } from 'ws';
import {
  addPlayer,
  claimLoteria,
  ClientMessageSchema,
  drawCard,
  grantClaim,
  hostView,
  newRound,
  playerView,
  rejectClaim,
  toggleMark,
  type ClientMessage,
  type ErrorCode,
  type GameResult,
  type ServerMessage,
} from '@loteria/core';
import { RoomRegistry, type Room, type Seat } from './rooms.js';

/** A socket that misses one ping round gets dropped, so its player shows as disconnected. */
const HEARTBEAT_MS = 30_000;
const SWEEP_MS = 10 * 60_000;
const ROOM_IDLE_MS = 6 * 60 * 60_000;

export interface Hub {
  close(): void;
}

export function attachHub(wss: WebSocketServer, registry = new RoomRegistry()): Hub {
  const roomOf = new Map<WebSocket, Room>();
  const alive = new WeakSet<WebSocket>();

  const send = (ws: WebSocket, message: ServerMessage): void => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  };
  const sendError = (ws: WebSocket, code: ErrorCode): void => send(ws, { t: 'error', code });

  function broadcast(room: Room): void {
    const connected = new Set<string>();
    for (const seat of room.sockets.values()) if (seat.role === 'player') connected.add(seat.playerId);
    for (const [ws, seat] of room.sockets) {
      send(
        ws,
        seat.role === 'host'
          ? { t: 'host-view', view: hostView(room.code, room.game, connected) }
          : { t: 'player-view', view: playerView(room.code, room.game, seat.playerId) },
      );
    }
  }

  function leave(ws: WebSocket): void {
    const room = roomOf.get(ws);
    if (!room) return;
    roomOf.delete(ws);
    room.sockets.delete(ws);
    broadcast(room);
  }

  function sit(ws: WebSocket, room: Room, token: string, seat: Seat): void {
    leave(ws);
    room.sockets.set(ws, seat);
    roomOf.set(ws, room);
    room.lastActive = Date.now();
    send(ws, { t: 'seat', role: seat.role, code: room.code, token });
    broadcast(room);
  }

  function apply(ws: WebSocket, room: Room, result: GameResult): void {
    if (!result.ok) return sendError(ws, result.error);
    room.game = result.game;
    broadcast(room);
  }

  function handle(ws: WebSocket, message: ClientMessage): void {
    switch (message.t) {
      case 'host': {
        const room = registry.create(Date.now());
        const seat: Seat = { role: 'host' };
        return sit(ws, room, registry.issueToken(room, seat), seat);
      }
      case 'join': {
        const room = registry.get(message.code);
        if (!room) return sendError(ws, 'room-not-found');
        const seat: Seat = { role: 'player', playerId: randomUUID() };
        room.game = addPlayer(room.game, seat.playerId, message.name, room.rng);
        return sit(ws, room, registry.issueToken(room, seat), seat);
      }
      case 'resume': {
        const room = registry.get(message.code);
        const seat = room?.seats.get(message.token);
        if (!room || !seat) return sendError(ws, 'session-expired');
        return sit(ws, room, message.token, seat);
      }
      default: {
        const room = roomOf.get(ws);
        const seat = room?.sockets.get(ws);
        if (!room || !seat) return sendError(ws, 'not-seated');
        room.lastActive = Date.now();
        switch (message.t) {
          case 'draw':
            if (seat.role !== 'host') return sendError(ws, 'not-host');
            return apply(ws, room, drawCard(room.game));
          case 'new-round':
            if (seat.role !== 'host') return sendError(ws, 'not-host');
            room.game = newRound(room.game, room.rng);
            return broadcast(room);
          case 'grant':
            if (seat.role !== 'host') return sendError(ws, 'not-host');
            return apply(ws, room, grantClaim(room.game, message.player));
          case 'reject':
            if (seat.role !== 'host') return sendError(ws, 'not-host');
            return apply(ws, room, rejectClaim(room.game, message.player));
          case 'mark':
            if (seat.role !== 'player') return sendError(ws, 'not-player');
            return apply(ws, room, toggleMark(room.game, seat.playerId, message.card));
          case 'loteria':
            if (seat.role !== 'player') return sendError(ws, 'not-player');
            return apply(ws, room, claimLoteria(room.game, seat.playerId));
        }
      }
    }
  }

  wss.on('connection', (ws) => {
    alive.add(ws);
    ws.on('pong', () => alive.add(ws));
    ws.on('close', () => leave(ws));
    ws.on('message', (raw, isBinary) => {
      if (isBinary) return sendError(ws, 'bad-message');
      let data: unknown;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return sendError(ws, 'bad-message');
      }
      const parsed = ClientMessageSchema.safeParse(data);
      if (!parsed.success) return sendError(ws, 'bad-message');
      handle(ws, parsed.data);
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) {
        ws.terminate();
        continue;
      }
      alive.delete(ws);
      ws.ping();
    }
  }, HEARTBEAT_MS);
  const sweep = setInterval(() => registry.sweep(Date.now(), ROOM_IDLE_MS), SWEEP_MS);
  heartbeat.unref();
  sweep.unref();

  return {
    close() {
      clearInterval(heartbeat);
      clearInterval(sweep);
    },
  };
}
