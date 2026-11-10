/**
 * The messages between browser and server, and the views the server sends each seat.
 *
 * Each schema is the single definition of its message: the TypeScript type is inferred from it, the
 * server parses every inbound message with it, and the browser parses every outbound one.
 *
 * The caller sees everything: the calls, every seat's connection state, and each waiting claim with
 * the tabla behind it. A player sees only their own tabla, their beans and the state of their own
 * claim. Players hear the cards at the table, so their view carries no called cards at all, not
 * even hidden ones a curious player could read from the page. Once the caller grants a win,
 * everyone sees the winner's tabla so the table can check it.
 */

import { z } from 'zod';
import { DECK_SIZE } from './cards.js';
import { calledCards, claimLine, GAME_ERRORS, type Game } from './game.js';

export const ROOM_CODE_LENGTH = 4;
export const NAME_MAX_LENGTH = 20;

const CardIdSchema = z.number().int().min(1).max(DECK_SIZE);
const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(new RegExp(`^[A-Z]{${ROOM_CODE_LENGTH}}$`));
const TokenSchema = z.uuid();
const PlayerIdSchema = z.uuid();
const NameSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);

export const ClientMessageSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('host') }),
  z.object({ t: z.literal('join'), code: RoomCodeSchema, name: NameSchema }),
  z.object({ t: z.literal('resume'), code: RoomCodeSchema, token: TokenSchema }),
  z.object({ t: z.literal('draw') }),
  z.object({ t: z.literal('new-round') }),
  z.object({ t: z.literal('grant'), player: PlayerIdSchema }),
  z.object({ t: z.literal('reject'), player: PlayerIdSchema }),
  z.object({ t: z.literal('mark'), card: CardIdSchema }),
  z.object({ t: z.literal('loteria') }),
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
  tabla: z.array(CardIdSchema),
  line: z.array(z.number().int()),
});

/** A LOTERÍA call waiting for the caller, with what the caller needs to rule on it. */
const ClaimViewSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  tabla: z.array(CardIdSchema),
  marked: z.array(CardIdSchema),
  /** The line that makes it a win, or null when it is not one. */
  line: z.array(z.number().int()).nullable(),
});
export type ClaimView = z.infer<typeof ClaimViewSchema>;

export const HostViewSchema = z.object({
  code: RoomCodeSchema,
  round: z.number().int(),
  called: z.array(CardIdSchema),
  remaining: z.number().int(),
  players: z.array(SeatSummarySchema),
  claims: z.array(ClaimViewSchema),
  winner: WinnerViewSchema.nullable(),
});
export type HostView = z.infer<typeof HostViewSchema>;

/** Where a player's LOTERÍA call stands: none open, waiting on the caller, or just turned down. */
export const CLAIM_STATES = ['none', 'pending', 'rejected'] as const;

export const PlayerViewSchema = z.object({
  code: RoomCodeSchema,
  round: z.number().int(),
  you: z.string(),
  name: z.string(),
  tabla: z.array(CardIdSchema),
  marked: z.array(CardIdSchema),
  claim: z.enum(CLAIM_STATES),
  winner: WinnerViewSchema.nullable(),
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

function winnerView(game: Game): z.infer<typeof WinnerViewSchema> | null {
  if (!game.winner) return null;
  const player = seated(game, game.winner.playerId);
  return { playerId: player.id, name: player.name, tabla: [...player.tabla], line: [...game.winner.line] };
}

/** What the caller's screen shows. `connected` holds the ids of players with an open socket. */
export function hostView(code: string, game: Game, connected: ReadonlySet<string>): HostView {
  return {
    code,
    round: game.round,
    called: [...calledCards(game)],
    remaining: game.deck.length - game.calledCount,
    players: game.players.map((p) => ({ id: p.id, name: p.name, connected: connected.has(p.id) })),
    claims: game.claims.map((playerId) => {
      const player = seated(game, playerId);
      const line = claimLine(game, playerId);
      return {
        playerId,
        name: player.name,
        tabla: [...player.tabla],
        marked: [...player.marked],
        line: line ? [...line] : null,
      };
    }),
    winner: winnerView(game),
  };
}

/** What one player's phone shows: their own tabla, beans and claim, and the winner once granted. */
export function playerView(code: string, game: Game, playerId: string): PlayerView {
  const player = seated(game, playerId);
  return {
    code,
    round: game.round,
    you: player.id,
    name: player.name,
    tabla: [...player.tabla],
    marked: [...player.marked],
    claim: game.claims.includes(playerId) ? 'pending' : game.rejected.includes(playerId) ? 'rejected' : 'none',
    winner: winnerView(game),
  };
}
