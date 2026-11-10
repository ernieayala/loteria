import { describe, expect, it } from 'vitest';
import {
  addPlayer,
  calledCards,
  claimLine,
  claimLoteria,
  drawCard,
  grantClaim,
  newGame,
  newRound,
  rejectClaim,
  toggleMark,
  type Game,
} from './game.js';
import { mulberry32 } from './rng.js';

function unwrap(result: ReturnType<typeof drawCard>): Game {
  if (!result.ok) throw new Error(`Expected ok, got ${result.error}`);
  return result.game;
}

/** A one-player game with the deck rigged to call `called` first, in that order. */
function rigged(tabla: number[], called: number[]): Game {
  const rest = Array.from({ length: 54 }, (_, i) => i + 1).filter((id) => !called.includes(id));
  return {
    round: 1,
    deck: [...called, ...rest],
    calledCount: called.length,
    players: [{ id: 'p1', name: 'Ana', tabla, marked: [] }],
    winner: null,
    claims: [],
    rejected: [],
  };
}

const TABLA = Array.from({ length: 16 }, (_, i) => i + 1);

describe('newGame and drawCard', () => {
  it('starts with a full shuffled deck and nothing called', () => {
    const game = newGame(mulberry32(1));
    expect(game.deck).toHaveLength(54);
    expect(new Set(game.deck).size).toBe(54);
    expect(calledCards(game)).toEqual([]);
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
    const claimed = unwrap(claimLoteria(rigged(TABLA, []), 'p1'));
    expect(claimed.claims).toEqual(['p1']);
    expect(claimed.winner).toBeNull();
    expect(drawCard(claimed)).toEqual({ ok: false, error: 'claim-pending' });
    expect(toggleMark(claimed, 'p1', 1)).toEqual({ ok: false, error: 'claim-pending' });
    expect(claimLoteria(claimed, 'p1')).toEqual({ ok: false, error: 'claim-pending' });
  });

  it('backs a claim only with a line that is both marked and called', () => {
    expect(claimLine(markAll(rigged(TABLA, ROW), ROW), 'p1')).toEqual([0, 1, 2, 3]);
    // Marked but not all called.
    expect(claimLine(markAll(rigged(TABLA, [1, 2, 3]), ROW), 'p1')).toBeNull();
    // Called but not all marked.
    expect(claimLine(markAll(rigged(TABLA, ROW), [1, 2, 3]), 'p1')).toBeNull();
  });

  it('grants a backed claim, which ends the round', () => {
    const claimed = unwrap(claimLoteria(markAll(rigged(TABLA, [...ROW, 30]), ROW), 'p1'));
    const won = unwrap(grantClaim(claimed, 'p1'));
    expect(won.winner).toEqual({ playerId: 'p1', line: [0, 1, 2, 3] });
    expect(won.claims).toEqual([]);
    expect(drawCard(won)).toEqual({ ok: false, error: 'game-over' });
    expect(toggleMark(won, 'p1', 1)).toEqual({ ok: false, error: 'game-over' });
    expect(claimLoteria(won, 'p1')).toEqual({ ok: false, error: 'game-over' });
  });

  it('will not grant a claim with no line behind it', () => {
    const claimed = unwrap(claimLoteria(markAll(rigged(TABLA, [1, 2, 3]), ROW), 'p1'));
    expect(grantClaim(claimed, 'p1')).toEqual({ ok: false, error: 'no-line' });
  });

  it('turns a claim down, frees the deck and the tabla, and clears the notice once play goes on', () => {
    const claimed = unwrap(claimLoteria(rigged(TABLA, [1]), 'p1'));
    const rejected = unwrap(rejectClaim(claimed, 'p1'));
    expect(rejected.claims).toEqual([]);
    expect(rejected.rejected).toEqual(['p1']);
    expect(unwrap(drawCard(rejected)).rejected).toEqual([]);
    expect(unwrap(toggleMark(rejected, 'p1', 2)).rejected).toEqual([]);
    expect(unwrap(claimLoteria(rejected, 'p1'))).toMatchObject({ claims: ['p1'], rejected: [] });
  });

  it('rules only on claims that were made', () => {
    expect(grantClaim(rigged(TABLA, ROW), 'p1')).toEqual({ ok: false, error: 'no-claim' });
    expect(rejectClaim(rigged(TABLA, ROW), 'p1')).toEqual({ ok: false, error: 'no-claim' });
  });

  it('refuses an unknown player', () => {
    expect(claimLoteria(rigged(TABLA, []), 'nobody')).toEqual({ ok: false, error: 'unknown-player' });
  });
});

describe('newRound', () => {
  it('reshuffles, redeals, clears beans, claims and the winner, and keeps the players', () => {
    const rng = mulberry32(5);
    let game = addPlayer(addPlayer(newGame(rng), 'p1', 'Ana', rng), 'p2', 'Beto', rng);
    game = unwrap(drawCard(game));
    const next = newRound(
      { ...game, winner: { playerId: 'p1', line: [0, 1, 2, 3] }, claims: ['p2'], rejected: ['p1'] },
      rng,
    );
    expect(next.round).toBe(2);
    expect(next.calledCount).toBe(0);
    expect(next.winner).toBeNull();
    expect(next.claims).toEqual([]);
    expect(next.rejected).toEqual([]);
    expect(next.players.map((p) => p.name)).toEqual(['Ana', 'Beto']);
    expect(next.players.every((p) => p.marked.length === 0 && p.tabla.length === 16)).toBe(true);
    expect(next.players[0]?.tabla).not.toEqual(game.players[0]?.tabla);
  });
});
