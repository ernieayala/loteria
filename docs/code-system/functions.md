# Functions

## Rules

### A move returns a new game or a typed error

Every move in `game.ts` takes a `Game` and returns `GameResult`: `{ ok: true, game }` or `{ ok: false, error }`, built by `ok` and `fail` (`game.ts:67-70`). A refused move is a value, not an exception. The error is a `GameError`, which joins the wire's `ErrorCode` list and has a sentence in every language.

A move that cannot be refused returns `Game` directly: `newGame`, `addPlayer`, `newRound`.

- Conforming: `drawCard` returns `fail('claim-pending')` while a claim waits (`game.ts:119`).
- Non-conforming: `throw new Error('claim pending')` from a move.

Check: `tsc --build` (the return type); review.

### Checks run in a fixed order, cheapest refusal first

A move runs the checks that apply to it in this order: the round is over (`game-over`); the player exists (`unknown-player`); a claim is waiting (`claim-pending`); the move's own condition (`not-on-tabla`, `deck-empty`, `no-claim`, `no-win`, `round-started`). Each is an early `return fail(…)`.

- Conforming: `toggleMark` (`game.ts:128-142`).

Check: review.

### Game data is immutable

Every field is `readonly` and every array `readonly T[]`. A move spreads a new object; it never writes into the one it was given. The server holds one `Game` value per room and swaps it (`room.game = result.game`, `hub.ts:80`).

- Conforming: `{ ...game, calledCount: game.calledCount + 1, rejected: [] }`.
- Non-conforming: `game.claims.push(playerId)`.

Check: `tsc --build` (`readonly` makes the write a type error); review.

### Randomness is a parameter

Core never calls `Math.random`. A function that shuffles or deals takes an `Rng` (`rng.ts:2`), and the caller seeds it: the server with `randomInt(2 ** 32)` per room (`rooms.ts:30`), tests with a fixed seed, `beanSpot` with the round and card. The same seed and the same moves give the same game.

- Non-conforming: `shuffle(ids)` reaching for `Math.random` inside.

Check: `game.test.ts` ("produces the same game for the same seed and moves"); review.

### Time is a parameter where a test needs it

`RoomRegistry.create(now)` and `sweep(now, maxIdleMs)` take the time; `hub.ts` passes `Date.now()`. Core reads no clock.

Check: review.

### An internal invariant throws; it is never defaulted

A value that can be wrong only through a bug upstream throws with what was wrong: `card(id)` for an id the protocol already validated (`cards.ts:76-80`), `seated(game, playerId)` for a player the game must hold (`protocol.ts:140-144`).

- Non-conforming: `card(id) ?? DECK[0]`.

Check: `tabla.test.ts` ("throws on an id outside the deck").

### Settings go in an options object; data stays positional

A function that takes a set of settings or looks takes them as one options object after its main subject: `buttonHtml(label, { variant, size, action, … })`, `tablaHtml(tabla, opts)`, `startServer({ port, dev })`. Its type is `<Thing>Options`, with `readonly` fields and `?` on the optional ones. The data a function works on stays positional: `claimHtml(claim, othersWaiting, called, round, prize, t)`.

- Non-conforming: `buttonHtml(label, 'primary', 'block', undefined, true)`.

Check: review.

### No flag that switches what a function does

A boolean option changes how something looks or what it allows (`interactive`, `locked`), never which of two jobs the function does. Two jobs are two functions: `hostAnnouncement` and `playerAnnouncement`, not `announcement(view, isHost)`.

Check: review.

### A `switch` on a message names every case

A `switch` on a message's `t` has one `case` per message type, and TypeScript narrows the message inside each. These handlers return `void`, so a missing case does not fail to compile: a new message type means finding each switch on it, `handle` in `hub.ts:84-135` and `onMessage` in `web/src/main.ts:157-198`. `noFallthroughCasesInSwitch` is on.

Check: `tsc --build` for fallthrough; a missing case is review.
