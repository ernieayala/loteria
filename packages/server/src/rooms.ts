import { randomInt, randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import { mulberry32, newGame, ROOM_CODE_LENGTH, type Game, type Rng } from '@loteria/core';

export type Seat = { readonly role: 'host' } | { readonly role: 'player'; readonly playerId: string };

export interface Room {
  readonly code: string;
  readonly rng: Rng;
  game: Game;
  /** Secret token to seat. The token is what lets a phone that slept take its seat back. */
  readonly seats: Map<string, Seat>;
  /** Open sockets and the seat each one holds. One seat may hold several, one per open tab. */
  readonly sockets: Map<WebSocket, Seat>;
  lastActive: number;
}

// No I, L, or O: called across a room they get heard and typed as 1 and 0.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';

/** Every live room, by code. Rooms live in memory only, so a restart ends every game. */
export class RoomRegistry {
  readonly #rooms = new Map<string, Room>();

  create(now: number): Room {
    let code: string;
    do {
      code = Array.from({ length: ROOM_CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
    } while (this.#rooms.has(code));
    const rng = mulberry32(randomInt(2 ** 32));
    const room: Room = { code, rng, game: newGame(rng), seats: new Map(), sockets: new Map(), lastActive: now };
    this.#rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.#rooms.get(code);
  }

  /** Issue a new secret token for a seat in this room. */
  issueToken(room: Room, seat: Seat): string {
    const token = randomUUID();
    room.seats.set(token, seat);
    return token;
  }

  /** Drop rooms nobody has had open for `maxIdleMs`. Returns how many went. */
  sweep(now: number, maxIdleMs: number): number {
    let dropped = 0;
    for (const [code, room] of this.#rooms) {
      if (room.sockets.size === 0 && now - room.lastActive > maxIdleMs) {
        this.#rooms.delete(code);
        dropped++;
      }
    }
    return dropped;
  }
}
