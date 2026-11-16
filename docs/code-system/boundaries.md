# Trust boundaries

Input is checked once, where it enters. Past that point the code trusts its types: a value that is wrong there is a bug to fix where it came from, not a case to handle.

## The boundaries

| Boundary                                    | Checked by                                                                                                                                                                               | On failure                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| A message from a browser                    | `JSON.parse`, then `ClientMessageSchema.safeParse` (`hub.ts:141-152`); `maxPayload` of 4 KiB (`server.ts:12`, `:53`)                                                                     | `bad-message` to that socket; nothing else happens       |
| A message from the server                   | `ServerMessageSchema.safeParse` (`socket.ts:39-51`)                                                                                                                                      | `console.error` with `[loteria]`; the message is dropped |
| A move from the wrong seat                  | `seat.role` in `hub.ts` (`hub.ts:110-131`)                                                                                                                                               | `not-host`, `not-player`, `not-seated`                   |
| A request path                              | `decodeURIComponent` in a `try`, then the resolved file must sit inside the web root (`static.ts:35-43`)                                                                                 | 400 for a bad escape, 404 for anything outside           |
| Browser storage                             | `try` around every access; a stored seat goes through `SeatMessageSchema` (`session.ts:16-35`, `i18n.ts:409-423`); a stored name is used as typed text, escaped where shown (`loadName`) | The store is skipped; the page works without it          |
| `PORT`                                      | `readPort` (`server/src/main.ts:6-13`)                                                                                                                                                   | The process stops with a message naming the value        |
| `?join=` in the URL                         | Trimmed, upper-cased, cut to `ROOM_CODE_LENGTH` (`web/src/main.ts:47-48`); the server validates it again on join                                                                         |                                                          |
| A name a player typed, on screen            | `esc` (`render.ts:34-35`)                                                                                                                                                                |                                                          |
| `data-*` read back from the DOM             | `isLang` for `data-lang` (`web/src/main.ts:257`), `isWinRule` for `data-rule`; the server's schema for the rest                                                                          | Ignored                                                  |
| Browser APIs that may be missing or refused | `'share' in navigator`, then `try` (`web/src/main.ts:204-222`)                                                                                                                           | The next way: share, then copy, then the link on screen  |

## Rules

### One schema per message, used on both sides

Each zod schema in `protocol.ts` is the single definition of its message: the type is inferred from it, the server parses inbound messages with it, and the browser parses outbound ones.

- Non-conforming: a hand-written type for a message beside its schema.

Check: `protocol.test.ts` (what the schema accepts and rejects; a view round-trips).

### Normalize at the boundary

The schema trims and upper-cases a room code and trims a name (`protocol.ts:25-32`), so code past it never sees `" abcd "`.

Check: `protocol.test.ts` ("normalizes a typed room code and name").

### No guard inside

Code past a boundary does not re-check what the boundary proved. A guard on an internal call hides the bug that sent a bad value.

- Conforming: `card(id)` throws on an unknown id instead of returning a placeholder.
- Non-conforming: `if (typeof message.card !== 'number') return;` in `hub.ts` after `ClientMessageSchema` has parsed it.

Check: review.

### `try` only around what can throw for reasons outside the code

`JSON.parse` of a wire message, storage access, `decodeURIComponent`, `navigator.share`, `navigator.clipboard`. Each `catch` says in a comment, or by what it returns, why the failure is expected.

- Non-conforming: a `try` around `drawCard`.

Check: review.
