import { describe, expect, it } from 'vitest';
import type { Game } from './game.js';
import { ClientMessageSchema, ServerMessageSchema, hostView, playerView } from './protocol.js';

describe('ClientMessageSchema', () => {
  it('normalizes a typed room code and name', () => {
    expect(ClientMessageSchema.parse({ t: 'join', code: ' abcd ', name: '  Ana ' })).toEqual({
      t: 'join',
      code: 'ABCD',
      name: 'Ana',
    });
  });

  it.each([
    ['a short code', { t: 'join', code: 'ABC', name: 'Ana' }],
    ['a blank name', { t: 'join', code: 'ABCD', name: '   ' }],
    ['a 21-character name', { t: 'join', code: 'ABCD', name: 'x'.repeat(21) }],
    ['card 0', { t: 'mark', card: 0 }],
    ['card 55', { t: 'mark', card: 55 }],
    ['a fractional card', { t: 'mark', card: 1.5 }],
    ['a token that is not a uuid', { t: 'resume', code: 'ABCD', token: 'abc' }],
    ['a ruling on a player id that is not a uuid', { t: 'grant', player: 'p1' }],
    ['an unknown rule', { t: 'rule', rule: 'corners' }],
    ['a rule message with no rule', { t: 'rule' }],
    ['an unknown type', { t: 'cheat' }],
  ])('rejects %s', (_label, message) => {
    expect(ClientMessageSchema.safeParse(message).success).toBe(false);
  });

  it('accepts each win rule', () => {
    expect(ClientMessageSchema.parse({ t: 'rule', rule: 'full' })).toEqual({ t: 'rule', rule: 'full' });
    expect(ClientMessageSchema.parse({ t: 'rule', rule: 'line' })).toEqual({ t: 'rule', rule: 'line' });
  });

  it('accepts the caller ruling on a claim', () => {
    const player = '00000000-0000-4000-8000-000000000001';
    expect(ClientMessageSchema.parse({ t: 'grant', player })).toEqual({ t: 'grant', player });
    expect(ClientMessageSchema.parse({ t: 'reject', player })).toEqual({ t: 'reject', player });
  });
});

describe('views', () => {
  const game: Game = {
    round: 1,
    rule: 'line',
    deck: Array.from({ length: 54 }, (_, i) => i + 1),
    calledCount: 2,
    players: [
      { id: 'p1', name: 'Ana', tabla: Array.from({ length: 16 }, (_, i) => i + 1), marked: [1], wins: 0 },
      { id: 'p2', name: 'Beto', tabla: Array.from({ length: 16 }, (_, i) => i + 20), marked: [], wins: 1 },
    ],
    winners: [],
    claims: [],
    rejected: [],
  };

  it('gives the host every seat with its connection state', () => {
    expect(hostView('ABCD', game, new Set(['p2']))).toEqual({
      code: 'ABCD',
      round: 1,
      rule: 'line',
      prize: 'line',
      winners: [],
      called: [1, 2],
      remaining: 52,
      players: [
        { id: 'p1', name: 'Ana', connected: false },
        { id: 'p2', name: 'Beto', connected: true },
      ],
      claims: [],
    });
  });

  it('shows the host each waiting claim with its tabla, beans, past wins, and the cells behind it if any', () => {
    // Ana has 1 and 2 called and marked, so no line; Beto's whole first row is called and marked.
    const claimed: Game = {
      ...game,
      calledCount: 23,
      players: [game.players[0]!, { ...game.players[1]!, marked: [20, 21, 22, 23] }],
      claims: ['p1', 'p2'],
    };
    expect(hostView('ABCD', claimed, new Set()).claims).toEqual([
      { playerId: 'p1', name: 'Ana', tabla: game.players[0]?.tabla, marked: [1], wins: 0, cells: null },
      {
        playerId: 'p2',
        name: 'Beto',
        tabla: game.players[1]?.tabla,
        marked: [20, 21, 22, 23],
        wins: 1,
        cells: [0, 1, 2, 3],
      },
    ]);
    // The same tabla is no win when the round is for a full tabla.
    expect(hostView('ABCD', { ...claimed, rule: 'full' }, new Set()).claims[1]?.cells).toBeNull();
  });

  it("gives a player the prizes, their own tabla, beans and claim and the last call, never another player's or earlier calls", () => {
    const view = playerView('ABCD', game, 'p1');
    expect(view).toEqual({
      code: 'ABCD',
      round: 1,
      rule: 'line',
      prize: 'line',
      winners: [],
      you: 'p1',
      name: 'Ana',
      tabla: game.players[0]?.tabla,
      marked: [1],
      claim: 'none',
      last: 2,
    });
    expect(JSON.stringify(view)).not.toContain('"tabla":[20');
  });

  it('gives a player no last call before the first card', () => {
    expect(playerView('ABCD', { ...game, calledCount: 0 }, 'p1').last).toBeNull();
  });

  it("reports a player's claim as pending, then rejected", () => {
    expect(playerView('ABCD', { ...game, claims: ['p1'] }, 'p1').claim).toBe('pending');
    expect(playerView('ABCD', { ...game, rejected: ['p1'] }, 'p1').claim).toBe('rejected');
    expect(playerView('ABCD', { ...game, claims: ['p2'] }, 'p1').claim).toBe('none');
  });

  it("shows everyone each winner's tabla and winning cells, and the prize still in play", () => {
    const lineWon: Game = {
      ...game,
      rule: 'line-then-full',
      winners: [{ playerId: 'p2', prize: 'line', cells: [0, 1, 2, 3] }],
    };
    const view = playerView('ABCD', lineWon, 'p1');
    expect(view.winners).toEqual([
      { playerId: 'p2', name: 'Beto', prize: 'line', tabla: game.players[1]?.tabla, cells: [0, 1, 2, 3] },
    ]);
    expect(view.prize).toBe('full');
    expect(playerView('ABCD', { ...lineWon, rule: 'line' }, 'p1').prize).toBeNull();
  });

  it('round-trips through the server message schema', () => {
    const won: Game = { ...game, winners: [{ playerId: 'p2', prize: 'line', cells: [0, 1, 2, 3] }] };
    const message = { t: 'player-view', view: playerView('ABCD', won, 'p1') };
    expect(ServerMessageSchema.parse(JSON.parse(JSON.stringify(message)))).toEqual(message);
  });
});
