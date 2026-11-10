import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import {
  LINES,
  ServerMessageSchema,
  type ClientMessage,
  type HostView,
  type PlayerView,
  type ServerMessage,
} from '@loteria/core';
import { SOCKET_PATH, startServer, type RunningServer } from './server.js';

let server: RunningServer;

beforeAll(async () => {
  server = await startServer({ port: 0, dev: false });
});

afterAll(async () => {
  await server.close();
});

/** A test client that keeps every message and waits for the next one matching a predicate. */
class Client {
  readonly ws: WebSocket;
  readonly #inbox: ServerMessage[] = [];
  readonly #waiters: { match: (m: ServerMessage) => boolean; resolve: (m: ServerMessage) => void }[] = [];

  constructor() {
    this.ws = new WebSocket(`ws://localhost:${server.port}${SOCKET_PATH}`);
    this.ws.on('message', (raw) => {
      const message = ServerMessageSchema.parse(JSON.parse(raw.toString()));
      const waiter = this.#waiters.findIndex((w) => w.match(message));
      if (waiter >= 0) this.#waiters.splice(waiter, 1)[0]!.resolve(message);
      else this.#inbox.push(message);
    });
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.once('open', () => resolve());
      this.ws.once('error', reject);
    });
  }

  send(message: ClientMessage | Record<string, unknown>): void {
    this.ws.send(JSON.stringify(message));
  }

  next<T extends ServerMessage['t']>(t: T, match: (m: Extract<ServerMessage, { t: T }>) => boolean = () => true) {
    const test = (m: ServerMessage): boolean => m.t === t && match(m as Extract<ServerMessage, { t: T }>);
    const queued = this.#inbox.findIndex(test);
    if (queued >= 0) return Promise.resolve(this.#inbox.splice(queued, 1)[0] as Extract<ServerMessage, { t: T }>);
    return new Promise<Extract<ServerMessage, { t: T }>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${t}`)), 2000);
      this.#waiters.push({
        match: test,
        resolve: (m) => {
          clearTimeout(timer);
          resolve(m as Extract<ServerMessage, { t: T }>);
        },
      });
    });
  }

  close(): void {
    this.ws.close();
  }
}

async function connected(): Promise<Client> {
  const client = new Client();
  await client.open();
  return client;
}

async function hostAndJoin(name = 'Ana') {
  const host = await connected();
  host.send({ t: 'host' });
  const hostSeat = await host.next('seat');
  const player = await connected();
  player.send({ t: 'join', code: hostSeat.code.toLowerCase(), name });
  const playerSeat = await player.next('seat');
  const view = (await player.next('player-view')).view;
  // Wait on state, never on arrival order: the host's copy of this join travels on its own socket
  // and can land after the player's.
  await host.next('host-view', (m) => m.view.players.some((p) => p.name === name && p.connected));
  return { host, player, code: hostSeat.code, hostToken: hostSeat.token, playerToken: playerSeat.token, view };
}

/** Have the host call cards until every card in `wanted` is out. Returns the last host view. */
async function drawUntil(host: Client, wanted: readonly number[]): Promise<HostView> {
  let view: HostView | undefined;
  while (!view || !wanted.every((id) => view!.called.includes(id))) {
    const count = (view?.called.length ?? 0) + 1;
    host.send({ t: 'draw' });
    view = (await host.next('host-view', (m) => m.view.called.length === count)).view;
  }
  return view;
}

const firstRow = (view: PlayerView): number[] => LINES[0]!.map((cell) => view.tabla[cell]!);

describe('hub', () => {
  it('seats a host with a four-letter room code', async () => {
    const host = await connected();
    host.send({ t: 'host' });
    const seat = await host.next('seat');
    expect(seat.role).toBe('host');
    expect(seat.code).toMatch(/^[A-Z]{4}$/);
    const view = (await host.next('host-view')).view;
    expect(view).toMatchObject({ code: seat.code, called: [], remaining: 54, players: [], winner: null });
    host.close();
  });

  it('shows the host a joining player as connected, then disconnected', async () => {
    const { host, player } = await hostAndJoin('Beto');
    player.close();
    const view = (await host.next('host-view', (m) => m.view.players[0]?.connected === false)).view;
    expect(view.players).toEqual([{ id: expect.any(String), name: 'Beto', connected: false }]);
    host.close();
  });

  it('never sends a player the calls', async () => {
    const { host, player } = await hostAndJoin();
    host.send({ t: 'draw' });
    await host.next('host-view', (m) => m.view.called.length === 1);
    host.send({ t: 'draw' });
    await host.next('host-view', (m) => m.view.called.length === 2);
    player.send({ t: 'loteria' });
    const view = (await player.next('player-view', (m) => m.view.claim === 'pending')).view;
    expect(Object.keys(view).sort()).toEqual(['claim', 'code', 'marked', 'name', 'round', 'tabla', 'winner', 'you']);
    host.close();
    player.close();
  });

  it('plays a round: any bean, claim held for the caller, turned down, granted, frozen, new round', async () => {
    const { host, player, view } = await hostAndJoin();
    const row = firstRow(view);

    // A bean goes on any card of the tabla, called or not.
    player.send({ t: 'mark', card: row[0]! });
    await player.next('player-view', (m) => m.view.marked.includes(row[0]!));

    // A claim with nothing behind it goes to the caller; the player hears no verdict.
    player.send({ t: 'loteria' });
    expect((await player.next('player-view', (m) => m.view.claim === 'pending')).view.winner).toBeNull();
    const claim = (await host.next('host-view', (m) => m.view.claims.length === 1)).view.claims[0]!;
    expect(claim).toMatchObject({ name: 'Ana', marked: [row[0]], line: null });

    host.send({ t: 'draw' });
    expect((await host.next('error')).code).toBe('claim-pending');
    host.send({ t: 'grant', player: claim.playerId });
    expect((await host.next('error')).code).toBe('no-line');
    host.send({ t: 'reject', player: claim.playerId });
    await player.next('player-view', (m) => m.view.claim === 'rejected');

    await drawUntil(host, row);
    for (const id of row.slice(1)) {
      player.send({ t: 'mark', card: id });
      await player.next('player-view', (m) => m.view.marked.includes(id));
    }
    player.send({ t: 'loteria' });
    const backed = (await host.next('host-view', (m) => m.view.claims[0]?.line != null)).view.claims[0]!;
    expect(backed.line).toEqual([0, 1, 2, 3]);
    host.send({ t: 'grant', player: backed.playerId });
    const won = (await player.next('player-view', (m) => m.view.winner !== null)).view;
    expect(won).toMatchObject({ claim: 'none', winner: { name: 'Ana', line: [0, 1, 2, 3], tabla: view.tabla } });

    host.send({ t: 'draw' });
    expect((await host.next('error')).code).toBe('game-over');
    player.send({ t: 'mark', card: row[0]! });
    expect((await player.next('error')).code).toBe('game-over');

    host.send({ t: 'new-round' });
    const fresh = (await player.next('player-view', (m) => m.view.round === 2)).view;
    expect(fresh).toMatchObject({ marked: [], claim: 'none', winner: null });
    host.close();
    player.close();
  });

  it('gives a reconnecting player back their tabla and beans', async () => {
    const { host, player, code, playerToken, view } = await hostAndJoin();
    const first = view.tabla[0]!;
    await drawUntil(host, [first]);
    player.send({ t: 'mark', card: first });
    await player.next('player-view', (m) => m.view.marked.includes(first));
    player.close();

    const again = await connected();
    again.send({ t: 'resume', code, token: playerToken });
    expect((await again.next('seat')).token).toBe(playerToken);
    const resumed = (await again.next('player-view')).view;
    expect(resumed.tabla).toEqual(view.tabla);
    expect(resumed.marked).toEqual([first]);
    host.close();
    again.close();
  });

  it('keeps a waiting claim, and its ruling, across both sides reconnecting', async () => {
    const { host, player, code, hostToken, playerToken } = await hostAndJoin();
    player.send({ t: 'loteria' });
    await player.next('player-view', (m) => m.view.claim === 'pending');
    const { playerId } = (await host.next('host-view', (m) => m.view.claims.length === 1)).view.claims[0]!;

    // The player's phone sleeps while the claim waits, and wakes to the same claim.
    player.close();
    await host.next('host-view', (m) => m.view.players[0]?.connected === false);
    const back = await connected();
    back.send({ t: 'resume', code, token: playerToken });
    expect((await back.next('player-view')).view.claim).toBe('pending');

    // The caller's phone drops too, and comes back to the claim still waiting.
    host.close();
    const hostBack = await connected();
    hostBack.send({ t: 'resume', code, token: hostToken });
    const resumed = (await hostBack.next('host-view')).view;
    expect(resumed.claims.map((c) => c.playerId)).toEqual([playerId]);

    // The caller rules while the player is away; the player wakes to the ruling.
    back.close();
    hostBack.send({ t: 'reject', player: playerId });
    await hostBack.next('host-view', (m) => m.view.claims.length === 0);
    const again = await connected();
    again.send({ t: 'resume', code, token: playerToken });
    expect((await again.next('player-view')).view.claim).toBe('rejected');
    hostBack.close();
    again.close();
  });

  it('refuses moves from the wrong seat', async () => {
    const { host, player } = await hostAndJoin();
    player.send({ t: 'draw' });
    expect((await player.next('error')).code).toBe('not-host');
    player.send({ t: 'grant', player: '00000000-0000-4000-8000-000000000001' });
    expect((await player.next('error')).code).toBe('not-host');
    host.send({ t: 'loteria' });
    expect((await host.next('error')).code).toBe('not-player');
    host.close();
    player.close();
  });

  it('refuses moves from an unseated socket, unknown rooms, stale tokens, and junk', async () => {
    const client = await connected();
    client.send({ t: 'draw' });
    expect((await client.next('error')).code).toBe('not-seated');
    client.send({ t: 'join', code: 'ZZZZ', name: 'Ana' });
    expect((await client.next('error')).code).toBe('room-not-found');
    client.send({ t: 'resume', code: 'ZZZZ', token: '00000000-0000-4000-8000-000000000000' });
    expect((await client.next('error')).code).toBe('session-expired');
    client.ws.send('not json');
    expect((await client.next('error')).code).toBe('bad-message');
    client.send({ t: 'mark', card: 99 });
    expect((await client.next('error')).code).toBe('bad-message');
    client.close();
  });
});
