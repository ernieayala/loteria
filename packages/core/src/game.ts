/**
 * Game state and the moves that change it.
 *
 * A game is plain immutable data. Every move returns a new game or a typed error, so the server can
 * hold one value per room and replay any sequence in a test. Randomness arrives as a seeded
 * {@link Rng}; the same seed and the same moves produce the same game.
 *
 * The game is played in person. Players hear the cards from the caller, not from their phones, so a
 * player may put a bean on any card of their tabla, called or not. Calling LOTERÍA only puts a claim
 * in front of the caller; the caller checks it and grants the win or turns it down.
 */

import { DECK, type CardId } from './cards.js';
import { type Rng, shuffle } from './rng.js';
import { dealTabla, winningLine } from './tabla.js';

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly tabla: readonly CardId[];
  readonly marked: readonly CardId[];
}

export interface Winner {
  readonly playerId: string;
  /** Cell indexes of the completed line on the winner's tabla. */
  readonly line: readonly number[];
}

export interface Game {
  readonly round: number;
  /** The whole shuffled deck. The first `calledCount` cards are the ones read aloud so far. */
  readonly deck: readonly CardId[];
  readonly calledCount: number;
  readonly players: readonly Player[];
  readonly winner: Winner | null;
  /** Players who called LOTERÍA and wait for the caller's ruling, in the order they called. */
  readonly claims: readonly string[];
  /** Players whose last claim the caller turned down. Cleared when they play on or a card is called. */
  readonly rejected: readonly string[];
}

export const GAME_ERRORS = [
  'game-over',
  'deck-empty',
  'unknown-player',
  'not-on-tabla',
  'no-line',
  'claim-pending',
  'no-claim',
] as const;
export type GameError = (typeof GAME_ERRORS)[number];

export type GameResult = { readonly ok: true; readonly game: Game } | { readonly ok: false; readonly error: GameError };

const ok = (game: Game): GameResult => ({ ok: true, game });
const fail = (error: GameError): GameResult => ({ ok: false, error });

const ALL_IDS = DECK.map((c) => c.id);
const without = (ids: readonly string[], id: string): string[] => ids.filter((x) => x !== id);

export function newGame(rng: Rng): Game {
  return {
    round: 1,
    deck: shuffle(ALL_IDS, rng),
    calledCount: 0,
    players: [],
    winner: null,
    claims: [],
    rejected: [],
  };
}

export function calledCards(game: Game): readonly CardId[] {
  return game.deck.slice(0, game.calledCount);
}

/** Seat a new player with a fresh tabla. Joining mid-round is allowed; earlier calls still count. */
export function addPlayer(game: Game, id: string, name: string, rng: Rng): Game {
  return { ...game, players: [...game.players, { id, name, tabla: dealTabla(rng), marked: [] }] };
}

/**
 * Read the next card. A round with a winner is frozen until {@link newRound}, and a waiting claim
 * holds the deck, as a table stops calling while a tabla is checked.
 */
export function drawCard(game: Game): GameResult {
  if (game.winner) return fail('game-over');
  if (game.claims.length) return fail('claim-pending');
  if (game.calledCount >= game.deck.length) return fail('deck-empty');
  return ok({ ...game, calledCount: game.calledCount + 1, rejected: [] });
}

/**
 * Put a bean on a card of the player's own tabla, or take it off. Whether the card was called is
 * the caller's to judge when the player claims. A tabla under review cannot change.
 */
export function toggleMark(game: Game, playerId: string, cardId: CardId): GameResult {
  if (game.winner) return fail('game-over');
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return fail('unknown-player');
  if (game.claims.includes(playerId)) return fail('claim-pending');
  if (!player.tabla.includes(cardId)) return fail('not-on-tabla');
  const marked = player.marked.includes(cardId)
    ? player.marked.filter((id) => id !== cardId)
    : [...player.marked, cardId];
  return ok({
    ...game,
    players: game.players.map((p) => (p === player ? { ...p, marked } : p)),
    rejected: without(game.rejected, playerId),
  });
}

/** A player calls LOTERÍA. The claim waits for the caller; nothing is decided yet. */
export function claimLoteria(game: Game, playerId: string): GameResult {
  if (game.winner) return fail('game-over');
  if (!game.players.some((p) => p.id === playerId)) return fail('unknown-player');
  if (game.claims.includes(playerId)) return fail('claim-pending');
  return ok({ ...game, claims: [...game.claims, playerId], rejected: without(game.rejected, playerId) });
}

/**
 * The line that backs a player's claim: the first on their tabla whose every card was both marked
 * and called. Null when the claim is not a win.
 */
export function claimLine(game: Game, playerId: string): readonly number[] | null {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;
  return winningLine(player.tabla, new Set(player.marked), new Set(calledCards(game)));
}

/** The caller grants a waiting claim. Only a claim backed by a line can win; the round then ends. */
export function grantClaim(game: Game, playerId: string): GameResult {
  if (game.winner) return fail('game-over');
  if (!game.claims.includes(playerId)) return fail('no-claim');
  const line = claimLine(game, playerId);
  if (!line) return fail('no-line');
  return ok({ ...game, winner: { playerId, line }, claims: [], rejected: [] });
}

/** The caller turns a waiting claim down. The player is told and plays on. */
export function rejectClaim(game: Game, playerId: string): GameResult {
  if (game.winner) return fail('game-over');
  if (!game.claims.includes(playerId)) return fail('no-claim');
  return ok({ ...game, claims: without(game.claims, playerId), rejected: [...game.rejected, playerId] });
}

/** Reshuffle the deck and deal every seated player a new, unmarked tabla. */
export function newRound(game: Game, rng: Rng): Game {
  return {
    round: game.round + 1,
    deck: shuffle(ALL_IDS, rng),
    calledCount: 0,
    players: game.players.map((p) => ({ ...p, tabla: dealTabla(rng), marked: [] })),
    winner: null,
    claims: [],
    rejected: [],
  };
}
