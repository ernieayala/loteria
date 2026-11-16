/**
 * The messages between browser and server, and the views the server sends each seat.
 *
 * Each schema is the single definition of its message: the TypeScript type is inferred from it, the
 * server parses every inbound message with it, and the browser parses every outbound one.
 *
 * The caller sees everything: the calls, every seat's connection state, and each waiting claim with
 * the tabla behind it. A player sees only their own tabla, their beans and the state of their own
 * claim. Players hear the cards at the table, so their view carries only the latest call, for a
 * player who missed it, and never the earlier ones: keeping up still means listening. Every seat is
 * told the rule, the prize in play, and each winner with their tabla, so the table can check it.
 */

import { z } from 'zod';
import { DECK_SIZE } from './cards.js';
import { calledCards, claimCells, GAME_ERRORS, prizeInPlay, type Game } from './game.js';
import { PRIZES, WIN_RULES } from './tabla.js';

export const ROOM_CODE_LENGTH = 4;
export const NAME_MAX_LENGTH = 20;
/** The URL path the game socket upgrades on, the same for the page and the server. */
export const SOCKET_PATH = '/ws';

const CardIdSchema = z.number().int().min(1).max(DECK_SIZE);
const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(new RegExp(`^[A-Z]{${ROOM_CODE_LENGTH}}$`));
const TokenSchema = z.uuid();
const PlayerIdSchema = z.uuid();
const NameSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);
const WinRuleSchema = z.enum(WIN_RULES);
const PrizeSchema = z.enum(PRIZES);

export const ClientMessageSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('host') }),
  z.object({ t: z.literal('join'), code: RoomCodeSchema, name: NameSchema }),
  z.object({ t: z.literal('resume'), code: RoomCodeSchema, token: TokenSchema }),
  z.object({ t: z.literal('rule'), rule: WinRuleSchema }),
  z.object({ t: z.literal('draw') }),
  z.object({ t: z.literal('new-round') }),
  z.object({ t: z.literal('grant'), player: PlayerIdSchema }),
  z.object({ t: z.literal('reject'), player: PlayerIdSchema }),
  z.object({ t: z.literal('mark'), card: CardIdSchema }),
  z.object({ t: z.literal('claim') }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export const ERROR_CODES = [
  ...GAME_ERRORS,
  'bad-message',
  'room-not-found',
  'session-expired',
  'not-seated',
  'not-host',
  'not-player',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

const SeatSummarySchema = z.object({ id: z.string(), name: z.string(), connected: z.boolean() });

const WinnerViewSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  prize: PrizeSchema,
  tabla: z.array(CardIdSchema),
  cells: z.array(z.number().int()),
});
export type WinnerView = z.infer<typeof WinnerViewSchema>;

/** An ACHIK PUKLLAY claim waiting for the caller, with what the caller needs to rule on it. */
const ClaimViewSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  tabla: z.array(CardIdSchema),
  marked: z.array(CardIdSchema),
  /** Prizes this player has already won in this room, so the caller can spot a repeat winner. */
  wins: z.number().int(),
  /** The cells that win it the prize in play, or null when it is not a win. */
  cells: z.array(z.number().int()).nullable(),
});
export type ClaimView = z.infer<typeof ClaimViewSchema>;

/** What every seat is told about the round's prizes: the rule, who won what so far, and what is in play. */
const PrizesViewSchema = {
  rule: WinRuleSchema,
  /** The prize being played for now; null once every prize is won and the round is over. */
  prize: PrizeSchema.nullable(),
  /** Everyone sees each winner's tabla, so the table can check it. */
  winners: z.array(WinnerViewSchema),
};

export const HostViewSchema = z.object({
  code: RoomCodeSchema,
  round: z.number().int(),
  ...PrizesViewSchema,
  called: z.array(CardIdSchema),
  remaining: z.number().int(),
  players: z.array(SeatSummarySchema),
  claims: z.array(ClaimViewSchema),
});
export type HostView = z.infer<typeof HostViewSchema>;

/** Where a player's claim stands: none open, waiting on the caller, or just turned down. */
export const CLAIM_STATES = ['none', 'pending', 'rejected'] as const;

export const PlayerViewSchema = z.object({
  code: RoomCodeSchema,
  round: z.number().int(),
  /** Players play for the prizes, so they are told them; they are not calls. */
  ...PrizesViewSchema,
  you: z.string(),
  name: z.string(),
  tabla: z.array(CardIdSchema),
  marked: z.array(CardIdSchema),
  claim: z.enum(CLAIM_STATES),
  /** The card read aloud last, or null before the round's first. Never the calls before it. */
  last: CardIdSchema.nullable(),
});
export type PlayerView = z.infer<typeof PlayerViewSchema>;

export const SEAT_ROLES = ['host', 'player'] as const;

/** The server's answer to host, join, or resume. A browser keeps it to take the same seat back later. */
export const SeatMessageSchema = z.object({
  t: z.literal('seat'),
  role: z.enum(SEAT_ROLES),
  code: RoomCodeSchema,
  token: TokenSchema,
});
export type SeatMessage = z.infer<typeof SeatMessageSchema>;

export const ServerMessageSchema = z.discriminatedUnion('t', [
  SeatMessageSchema,
  z.object({ t: z.literal('host-view'), view: HostViewSchema }),
  z.object({ t: z.literal('player-view'), view: PlayerViewSchema }),
  z.object({ t: z.literal('error'), code: z.enum(ERROR_CODES) }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

function seated(game: Game, playerId: string): Game['players'][number] {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Player ${playerId} is not seated`);
  return player;
}

function prizesView(game: Game): Pick<HostView, 'rule' | 'prize' | 'winners'> {
  return {
    rule: game.rule,
    prize: prizeInPlay(game),
    winners: game.winners.map((w) => {
      const player = seated(game, w.playerId);
      return { playerId: player.id, name: player.name, prize: w.prize, tabla: [...player.tabla], cells: [...w.cells] };
    }),
  };
}

/** What the caller's screen shows. `connected` holds the ids of players with an open socket. */
export function hostView(code: string, game: Game, connected: ReadonlySet<string>): HostView {
  return {
    code,
    round: game.round,
    ...prizesView(game),
    called: [...calledCards(game)],
    remaining: game.deck.length - game.calledCount,
    players: game.players.map((p) => ({ id: p.id, name: p.name, connected: connected.has(p.id) })),
    claims: game.claims.map((playerId) => {
      const player = seated(game, playerId);
      const cells = claimCells(game, playerId);
      return {
        playerId,
        name: player.name,
        tabla: [...player.tabla],
        marked: [...player.marked],
        wins: player.wins,
        cells: cells ? [...cells] : null,
      };
    }),
  };
}

/** What one player's phone shows: their own tabla, beans and claim, the last call, and the prizes and winners. */
export function playerView(code: string, game: Game, playerId: string): PlayerView {
  const player = seated(game, playerId);
  return {
    code,
    round: game.round,
    ...prizesView(game),
    you: player.id,
    name: player.name,
    tabla: [...player.tabla],
    marked: [...player.marked],
    claim: game.claims.includes(playerId) ? 'pending' : game.rejected.includes(playerId) ? 'rejected' : 'none',
    last: calledCards(game).at(-1) ?? null,
  };
}
