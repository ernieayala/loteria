# Modules

## Packages

Three npm workspaces, built together by `tsc --build` with project references.

| Package           | Holds                                                                                            | May import                                                                        | Never                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `@loteria/core`   | The rules: the deck, tablas, win rules, moves, the wire protocol and the views each seat is sent | `zod`                                                                             | I/O, the clock, `Math.random`, the DOM, Node built-ins                                                 |
| `@loteria/server` | Rooms in memory, the WebSocket hub, the HTTP server and static files, the process entry          | `@loteria/core`, `ws`, Node built-ins; `vite` in dev only, loaded with `import()` | Rules: the server applies core's moves and decides nothing itself                                      |
| `@loteria/web`    | The page: state, rendering, words, the card art, the seat in storage, the socket                 | `@loteria/core`, the DOM, `uqr` (the QR code)                                     | Rules: the page sends a move and draws whatever view comes back, never judging whether a move is legal |

The packages keep the repo's original `loteria` name; the game they play is Achik Pukllay ([glossary](glossary.md)).

The server serves the web app's built folder by path (`server.ts:11`); the two packages never import each other.

- Conforming: `main.ts` sends `{ t: 'mark', card }` for every tap and lets the server refuse (`main.ts:281-282`).
- Non-conforming: the page checking `view.claim !== 'pending'` before sending a mark. The tabla is locked on screen, but the rule lives in `toggleMark`.

Check: `tsc --build` (a package can import only what its `references` and dependencies name); the rest is review.

## Files

| Package | File                  | Job                                                                                             |
| ------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| core    | `cards.ts`            | The 54-card deck, by Kichwa name, and `card(id)`                                                |
| core    | `rng.ts`              | The seeded generator and `shuffle`                                                              |
| core    | `tabla.ts`            | Dealing a tabla; the lines; the win rules; `winningCells`                                       |
| core    | `game.ts`             | The `Game` value and every move on it                                                           |
| core    | `protocol.ts`         | Message schemas, error codes, and the views                                                     |
| core    | `index.ts`            | Re-exports the five above; nothing else                                                         |
| server  | `main.ts`             | The process: reads `PORT` and `--dev`, prints the LAN addresses, closes on signals              |
| server  | `server.ts`           | One HTTP server: the health check, the page, and the socket upgrade                             |
| server  | `hub.ts`              | Parses each socket message, applies it to its room, sends every seat its view                   |
| server  | `rooms.ts`            | `RoomRegistry`: codes, tokens, the idle sweep                                                   |
| server  | `static.ts`           | Serves the built app safely                                                                     |
| web     | `main.ts`             | The page's one state value, one render, one click handler                                       |
| web     | `render.ts`           | Pure presentation: view in, HTML string out                                                     |
| web     | `i18n.ts`             | Every word, in both languages, card meanings included, and the language choice                  |
| web     | `art.ts`              | Each card's art URLs, from the WebP files Vite fingerprints                                     |
| web     | `cards/`              | The card art as WebP, written by `scripts/card-art.js`; never edited by hand                    |
| web     | `session.ts`          | What the browser remembers: the seat, and the name last joined with                             |
| web     | `socket.ts`           | One reconnecting WebSocket                                                                      |
| repo    | `scripts/card-art.js` | `npm run card-art`: the WebP files from the full-resolution PNGs in `cards/`, which git ignores |

A file holds one job. A second job is a second file.

- Conforming: `render.ts` reads no globals; `main.ts` passes it `location.origin` for the join link the lobby's QR code holds.
- Non-conforming: a render function reading `location` or `localStorage` itself.

Check: review.

## Exports from web and server

A module exports what another module or a test imports, and nothing more. Core is the exception: `index.ts` re-exports it whole, as the rules every package shares.

- Conforming: `esc`, `currentCardHtml`, and `tablaHtml` are private to `render.ts`.
- Non-conforming: exporting a helper "in case".

Check: review.

## Imports

Groups, in this order: Node built-ins (`node:` prefix), third-party packages, `@loteria/*`, then relative imports. No blank lines between groups.

- Conforming: `hub.ts:9-28`.
- Non-conforming: `import { randomUUID } from 'crypto'` without `node:`.

| Rule                                     | Detail                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Relative imports end in `.js`            | NodeNext resolution: `import { card } from './cards.js'`                                                                  |
| Other packages import core from its root | `from '@loteria/core'`, never `@loteria/core/dist/game.js`                                                                |
| Type-only names                          | `import type { … }` when every name is a type (`rooms.ts:2`); inline `type X` beside values otherwise (`render.ts:14-29`) |
| Side-effect imports                      | Only the stylesheet: `import './styles.css'` first in `web/src/main.ts`                                                   |

Check: `tsc --build` for resolution; order is review.

## Exports

Named exports only. A default export appears only where a tool requires one (`vite.config.ts`, `eslint.config.js`).

Check: review.

## Order inside a file

The header comment, imports, constants and types, then functions, each before the first function that uses it where the reading allows. `render.ts` groups its functions under `// ---- controls ----`, `cards`, `shared pieces`, and `screens` divider comments.

Check: review.
