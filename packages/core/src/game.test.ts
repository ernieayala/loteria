import { describe, expect, it } from 'vitest';
import {
  addPlayer,
  calledCards,
  claimCells,
  claimWin,
  drawCard,
  grantClaim,
  newGame,
  newRound,
  prizeInPlay,
  rejectClaim,
  setRule,
  toggleMark,
  type Game,
} from './game.js';
import { mulberry32 } from './rng.js';
import type { WinRule } from './tabla.js';

function unwrap(result: ReturnType<typeof drawCard>): Game {
  if (!result.ok) throw new Error(`Expected ok, got ${result.error}`);
  return result.game;
}

/** A one-player game under `rule`, with the deck rigged to call `called` first, in that order. */
function rigged(tabla: number[], called: number[], rule: WinRule = 'line'): Game {
  const rest = Array.from({ length: 54 }, (_, i) => i + 1).filter((id) => !called.includes(id));
  return {
    round: 1,
    rule,
    deck: [...called, ...rest],
    calledCount: called.length,
    players: [{ id: 'p1', name: 'Ana', tabla, marked: [], wins: 0 }],
    winners: [],
    claims: [],
    rejected: [],
  };
}

const TABLA = Array.from({ length: 16 }, (_, i) => i + 1);

describe('newGame and drawCard', () => {
  it('starts with a full shuffled deck, nothing called, playing for a line and then a full tabla', () => {
    const game = newGame(mulberry32(1));
    expect(game.deck).toHaveLength(54);
    expect(new Set(game.deck).size).toBe(54);
    expect(calledCards(game)).toEqual([]);
    expect(game.rule).toBe('line-then-full');
    expect(prizeInPlay(game)).toBe('line');
  });

  it('calls cards in deck order and stops when the deck runs out', () => {
    let game = newGame(mulberry32(1));
    for (let i = 0; i < 54; i++) game = unwrap(drawCard(game));
    expect(calledCards(game)).toEqual(game.deck);
    expect(drawCard(game)).toEqual({ ok: false, error: 'deck-empty' });
  });

  it('produces the same game for the same seed and moves', () => {
    const play = () => {
      const rng = mulberry32(99);
      let game = addPlayer(newGame(rng), 'p1', 'Ana', rng);
      game = unwrap(drawCard(game));
      return game;
    };
    expect(play()).toEqual(play());
  });
});

describe('setRule', () => {
  it('changes the rule before the first card, as often as the caller likes', () => {
    const line = unwrap(setRule(rigged(TABLA, [], 'full'), 'line'));
    expect(line.rule).toBe('line');
    expect(unwrap(setRule(line, 'full')).rule).toBe('full');
  });

  it('refuses once a card is out', () => {
    expect(setRule(rigged(TABLA, [3], 'full'), 'line')).toEqual({ ok: false, error: 'round-started' });
  });

  it('refuses in a round that is over', () => {
    const won: Game = { ...rigged(TABLA, []), winners: [{ playerId: 'p1', prize: 'line', cells: [0, 1, 2, 3] }] };
    expect(setRule(won, 'full')).toEqual({ ok: false, error: 'game-over' });
  });
});

describe('toggleMark', () => {
  it('marks a card on the tabla, then unmarks it', () => {
    const game = rigged(TABLA, [3]);
    const marked = unwrap(toggleMark(game, 'p1', 3));
    expect(marked.players[0]?.marked).toEqual([3]);
    expect(unwrap(toggleMark(marked, 'p1', 3)).players[0]?.marked).toEqual([]);
  });

  it('accepts a card not yet called: the caller judges that at a claim', () => {
    expect(unwrap(toggleMark(rigged(TABLA, [3]), 'p1', 4)).players[0]?.marked).toEqual([4]);
  });

  it('refuses a card that is not on the tabla', () => {
    expect(toggleMark(rigged(TABLA, [40]), 'p1', 40)).toEqual({ ok: false, error: 'not-on-tabla' });
  });

  it('refuses an unknown player', () => {
    expect(toggleMark(rigged(TABLA, [3]), 'nobody', 3)).toEqual({ ok: false, error: 'unknown-player' });
  });
});

describe('claims', () => {
  const markAll = (game: Game, ids: number[]): Game => ids.reduce((g, id) => unwrap(toggleMark(g, 'p1', id)), game);
  // Cards 1..4 sit in row 0, cells 0..3.
  const ROW = [1, 2, 3, 4];

  it('queues a claim without deciding it, and holds the deck and the tabla while it waits', () => {
    const claimed = unwrap(claimWin(rigged(TABLA, []), 'p1'));
    expect(claimed.claims).toEqual(['p1']);
    expect(claimed.winners).toEqual([]);
    expect(drawCard(claimed)).toEqual({ ok: false, error: 'claim-pending' });
    expect(toggleMark(claimed, 'p1', 1)).toEqual({ ok: false, error: 'claim-pending' });
    expect(claimWin(claimed, 'p1')).toEqual({ ok: false, error: 'claim-pending' });
  });

  it('backs a claim only with a line that is both marked and called', () => {
    expect(claimCells(markAll(rigged(TABLA, ROW), ROW), 'p1')).toEqual([0, 1, 2, 3]);
    // Marked but not all called.
    expect(claimCells(markAll(rigged(TABLA, [1, 2, 3]), ROW), 'p1')).toBeNull();
    // Called but not all marked.
    expect(claimCells(markAll(rigged(TABLA, ROW), [1, 2, 3]), 'p1')).toBeNull();
  });

  it('judges a claim by the round rule: a line is not a full tabla', () => {
    expect(claimCells(markAll(rigged(TABLA, ROW, 'full'), ROW), 'p1')).toBeNull();
    const full = markAll(rigged(TABLA, TABLA, 'full'), TABLA);
    expect(claimCells(full, 'p1')).toEqual(TABLA.map((_, cell) => cell));
  });

  it('grants a backed claim, which ends the round', () => {
    const claimed = unwrap(claimWin(markAll(rigged(TABLA, [...ROW, 30]), ROW), 'p1'));
    const won = unwrap(grantClaim(claimed, 'p1'));
    expect(won.winners).toEqual([{ playerId: 'p1', prize: 'line', cells: [0, 1, 2, 3] }]);
    expect(prizeInPlay(won)).toBeNull();
    expect(won.claims).toEqual([]);
    expect(drawCard(won)).toEqual({ ok: false, error: 'game-over' });
    expect(toggleMark(won, 'p1', 1)).toEqual({ ok: false, error: 'game-over' });
    expect(claimWin(won, 'p1')).toEqual({ ok: false, error: 'game-over' });
  });

  it('will not grant a claim that does not win under the rule', () => {
    const short = unwrap(claimWin(markAll(rigged(TABLA, [1, 2, 3]), ROW), 'p1'));
    expect(grantClaim(short, 'p1')).toEqual({ ok: false, error: 'no-win' });
    const lineOnly = unwrap(claimWin(markAll(rigged(TABLA, ROW, 'full'), ROW), 'p1'));
    expect(grantClaim(lineOnly, 'p1')).toEqual({ ok: false, error: 'no-win' });
  });

  it('turns a claim down, frees the deck and the tabla, and clears the notice once play goes on', () => {
    const claimed = unwrap(claimWin(rigged(TABLA, [1]), 'p1'));
    const rejected = unwrap(rejectClaim(claimed, 'p1'));
    expect(rejected.claims).toEqual([]);
    expect(rejected.rejected).toEqual(['p1']);
    expect(unwrap(drawCard(rejected)).rejected).toEqual([]);
    expect(unwrap(toggleMark(rejected, 'p1', 2)).rejected).toEqual([]);
    expect(unwrap(claimWin(rejected, 'p1'))).toMatchObject({ claims: ['p1'], rejected: [] });
  });

  it('plays a line, then a full tabla, in one round under line-then-full', () => {
    // Ana wins the line; play goes on, and Beto's line no longer wins anything.
    const beto = { id: 'p2', name: 'Beto', tabla: TABLA.map((id) => id + 20), marked: [21, 22, 23, 24], wins: 0 };
    const two: Game = { ...rigged(TABLA, [...TABLA, 21, 22, 23, 24], 'line-then-full'), players: [] };
    let game: Game = { ...two, players: [{ id: 'p1', name: 'Ana', tabla: TABLA, marked: [], wins: 0 }, beto] };
    game = markAll(game, ROW);
    game = unwrap(claimWin(unwrap(claimWin(game, 'p1')), 'p2'));
    game = unwrap(grantClaim(game, 'p1'));
    expect(game.winners).toEqual([{ playerId: 'p1', prize: 'line', cells: [0, 1, 2, 3] }]);
    // The other shout was for the line just won, so it is dropped.
    expect(game.claims).toEqual([]);
    expect(prizeInPlay(game)).toBe('full');
    expect(claimCells(game, 'p2')).toBeNull();
    // Play goes on: the deck and the tablas are open again.
    expect(drawCard(game).ok).toBe(true);

    // Ana fills her tabla and wins the full tabla too: a repeat winner is the caller's call, not a
    // rule. The round is over.
    expect(game.players[0]?.wins).toBe(1);
    game = markAll(
      game,
      TABLA.filter((id) => !ROW.includes(id)),
    );
    game = unwrap(grantClaim(unwrap(claimWin(game, 'p1')), 'p1'));
    expect(game.winners.map((w) => w.prize)).toEqual(['line', 'full']);
    expect(game.players.map((p) => p.wins)).toEqual([2, 0]);
    expect(game.winners[1]?.cells).toEqual(TABLA.map((_, cell) => cell));
    expect(prizeInPlay(game)).toBeNull();
    expect(drawCard(game)).toEqual({ ok: false, error: 'game-over' });
  });

  it('rules only on claims that were made', () => {
    expect(grantClaim(rigged(TABLA, ROW), 'p1')).toEqual({ ok: false, error: 'no-claim' });
    expect(rejectClaim(rigged(TABLA, ROW), 'p1')).toEqual({ ok: false, error: 'no-claim' });
  });

  it('refuses an unknown player', () => {
    expect(claimWin(rigged(TABLA, []), 'nobody')).toEqual({ ok: false, error: 'unknown-player' });
  });
});

describe('newRound', () => {
  it('reshuffles, redeals, clears beans, claims and winners, and keeps the players, their wins and the rule', () => {
    const rng = mulberry32(5);
    let game = addPlayer(addPlayer(newGame(rng), 'p1', 'Ana', rng), 'p2', 'Beto', rng);
    game = { ...game, players: game.players.map((p) => (p.id === 'p1' ? { ...p, wins: 1 } : p)) };
    game = unwrap(setRule(game, 'line'));
    game = unwrap(drawCard(game));
    const next = newRound(
      { ...game, winners: [{ playerId: 'p1', prize: 'line', cells: [0, 1, 2, 3] }], claims: ['p2'], rejected: ['p1'] },
      rng,
    );
    expect(next.round).toBe(2);
    expect(next.rule).toBe('line');
    expect(next.calledCount).toBe(0);
    expect(next.winners).toEqual([]);
    expect(next.claims).toEqual([]);
    expect(next.rejected).toEqual([]);
    expect(next.players.map((p) => p.name)).toEqual(['Ana', 'Beto']);
    expect(next.players.map((p) => p.wins)).toEqual([1, 0]);
    expect(next.players.every((p) => p.marked.length === 0 && p.tabla.length === 16)).toBe(true);
    expect(next.players[0]?.tabla).not.toEqual(game.players[0]?.tabla);
  });
});
