/**
 * Game state and the moves that change it.
 *
 * A game is plain immutable data. Every move returns a new game or a typed error, so the server can
 * hold one value per room and replay any sequence in a test. Randomness arrives as a seeded
 * {@link Rng}; the same seed and the same moves produce the same game.
 *
 * The game is played in person. Players hear the cards from the caller; a phone shows at most the
 * latest one. So a player may put a bean on any card of their tabla, called or not. Shouting ACHIK
 * PUKLLAY only puts a claim in front of the caller; the caller checks it and grants the win or
 * turns it down.
 *
 * A round awards the prizes its rule names, one at a time: under `line-then-full` the first line
 * wins and play goes on for a full tabla. The round is over once every prize is won.
 */

import { DECK, type CardId } from './cards.js';
import { type Rng, shuffle } from './rng.js';
import { dealTabla, RULE_PRIZES, winningCells, type Prize, type WinRule } from './tabla.js';

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly tabla: readonly CardId[];
  readonly marked: readonly CardId[];
  /**
   * Prizes granted to this player in every round in the room so far. A player may win twice; the
   * caller sees the count on a claim and decides whether to let a repeat winner take another.
   */
  readonly wins: number;
}

export interface Winner {
  readonly playerId: string;
  readonly prize: Prize;
  /** Cell indexes on the winner's tabla that won the prize: a line, or every cell. */
  readonly cells: readonly number[];
}

export interface Game {
  readonly round: number;
  /** What this round awards. The caller sets it before the first card. */
  readonly rule: WinRule;
  /** The whole shuffled deck. The first `calledCount` cards are the ones read aloud so far. */
  readonly deck: readonly CardId[];
  readonly calledCount: number;
  readonly players: readonly Player[];
  /** The prizes won this round, in the order the caller granted them. */
  readonly winners: readonly Winner[];
  /** Players who shouted ACHIK PUKLLAY and wait for the caller's ruling, in the order they shouted. */
  readonly claims: readonly string[];
  /** Players whose last claim the caller turned down. Cleared when they play on or a card is called. */
  readonly rejected: readonly string[];
}

export const GAME_ERRORS = [
  'game-over',
  'deck-empty',
  'unknown-player',
  'not-on-tabla',
  'no-win',
  'claim-pending',
  'no-claim',
  'round-started',
] as const;
export type GameError = (typeof GAME_ERRORS)[number];

export type GameResult = { readonly ok: true; readonly game: Game } | { readonly ok: false; readonly error: GameError };

const ok = (game: Game): GameResult => ({ ok: true, game });
const fail = (error: GameError): GameResult => ({ ok: false, error });

const ALL_IDS = DECK.map((c) => c.id);
const without = (ids: readonly string[], id: string): string[] => ids.filter((x) => x !== id);

/** A new game plays for a line and then a full tabla, as the game is usually played, until the caller picks otherwise. */
export function newGame(rng: Rng): Game {
  return {
    round: 1,
    rule: 'line-then-full',
    deck: shuffle(ALL_IDS, rng),
    calledCount: 0,
    players: [],
    winners: [],
    claims: [],
    rejected: [],
  };
}

export function calledCards(game: Game): readonly CardId[] {
  return game.deck.slice(0, game.calledCount);
}

/** The prize the round is playing for now, or null once every prize is won and the round is over. */
export function prizeInPlay(game: Game): Prize | null {
  return RULE_PRIZES[game.rule][game.winners.length] ?? null;
}

/** Seat a new player with a fresh tabla. Joining mid-round is allowed; earlier calls still count. */
export function addPlayer(game: Game, id: string, name: string, rng: Rng): Game {
  return { ...game, players: [...game.players, { id, name, tabla: dealTabla(rng), marked: [], wins: 0 }] };
}

/**
 * Choose what this round awards. Only before the first card: once a card is out, players have been
 * playing for the rule they were told.
 */
export function setRule(game: Game, rule: WinRule): GameResult {
  if (!prizeInPlay(game)) return fail('game-over');
  if (game.calledCount > 0) return fail('round-started');
  return ok({ ...game, rule });
}

/**
 * Read the next card. A round with every prize won is frozen until {@link newRound}, and a waiting
 * claim holds the deck, as a table stops calling while a tabla is checked.
 */
export function drawCard(game: Game): GameResult {
  if (!prizeInPlay(game)) return fail('game-over');
  if (game.claims.length) return fail('claim-pending');
  if (game.calledCount >= game.deck.length) return fail('deck-empty');
  return ok({ ...game, calledCount: game.calledCount + 1, rejected: [] });
}

/**
 * Put a bean on a card of the player's own tabla, or take it off. Whether the card was called is
 * the caller's to judge when the player claims. A tabla under review cannot change.
 */
export function toggleMark(game: Game, playerId: string, cardId: CardId): GameResult {
  if (!prizeInPlay(game)) return fail('game-over');
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

/** A player shouts ACHIK PUKLLAY. The claim waits for the caller; nothing is decided yet. */
export function claimWin(game: Game, playerId: string): GameResult {
  if (!prizeInPlay(game)) return fail('game-over');
  if (!game.players.some((p) => p.id === playerId)) return fail('unknown-player');
  if (game.claims.includes(playerId)) return fail('claim-pending');
  return ok({ ...game, claims: [...game.claims, playerId], rejected: without(game.rejected, playerId) });
}

/**
 * The cells that back a player's claim to the prize in play, every one both marked and called.
 * Null when the claim is not a win, or when the round is over.
 */
export function claimCells(game: Game, playerId: string): readonly number[] | null {
  const prize = prizeInPlay(game);
  const player = game.players.find((p) => p.id === playerId);
  if (!prize || !player) return null;
  return winningCells(player.tabla, new Set(player.marked), new Set(calledCards(game)), prize);
}

/**
 * The caller grants a waiting claim the prize in play. Only a claim that wins it can be granted.
 * Every other waiting claim is dropped with it: they were shouts for the prize just won. Play goes
 * on for the next prize, if the rule has one.
 */
export function grantClaim(game: Game, playerId: string): GameResult {
  const prize = prizeInPlay(game);
  if (!prize) return fail('game-over');
  if (!game.claims.includes(playerId)) return fail('no-claim');
  const cells = claimCells(game, playerId);
  if (!cells) return fail('no-win');
  return ok({
    ...game,
    players: game.players.map((p) => (p.id === playerId ? { ...p, wins: p.wins + 1 } : p)),
    winners: [...game.winners, { playerId, prize, cells }],
    claims: [],
    rejected: [],
  });
}

/** The caller turns a waiting claim down. The player is told and plays on. */
export function rejectClaim(game: Game, playerId: string): GameResult {
  if (!prizeInPlay(game)) return fail('game-over');
  if (!game.claims.includes(playerId)) return fail('no-claim');
  return ok({ ...game, claims: without(game.claims, playerId), rejected: [...game.rejected, playerId] });
}

/** Reshuffle the deck and deal every seated player a new, unmarked tabla. The rule and win counts carry over. */
export function newRound(game: Game, rng: Rng): Game {
  return {
    round: game.round + 1,
    rule: game.rule,
    deck: shuffle(ALL_IDS, rng),
    calledCount: 0,
    players: game.players.map((p) => ({ ...p, tabla: dealTabla(rng), marked: [] })),
    winners: [],
    claims: [],
    rejected: [],
  };
}
