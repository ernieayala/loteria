# Naming

One row per kind of identifier. Game words come from the [glossary](glossary.md); this page gives the pattern around them.

## Files and packages

| Kind            | Pattern                           | Examples                                              | Counter-example              |
| --------------- | --------------------------------- | ----------------------------------------------------- | ---------------------------- |
| Package         | `@loteria/<layer>`                | `@loteria/core`, `@loteria/server`, `@loteria/web`    | `@loteria/utils`             |
| Source file     | One lowercase word for its job    | `game.ts`, `protocol.ts`, `hub.ts`, `render.ts`       | `gameUtils.ts`, `helpers.ts` |
| Test file       | `<file>.test.ts`, beside the file | `game.test.ts`                                        | `tests/game.spec.ts`         |
| Tool-named file | The tool's own name               | `vite-env.d.ts`, `vite.config.ts`, `eslint.config.js` |                              |
| Card art        | `<two-digit id>-<width>.webp`     | `01-320.webp`, `54-720.webp`                          | `kinti.webp`                 |

## TypeScript

| Kind                | Pattern                                                                                                                    | Examples                                                                             | Counter-example                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Type, interface     | PascalCase noun                                                                                                            | `Game`, `Player`, `Seat`, `RunningServer`                                            | `IGame`, `GameType`                                        |
| Options object type | `<Thing>Options`                                                                                                           | `ButtonOptions`, `TablaOptions`, `ServerOptions`                                     | `ButtonProps`                                              |
| zod schema          | `<Type>Schema`; the type is `z.infer` of it, named without the suffix                                                      | `ClientMessageSchema` / `ClientMessage`                                              | a hand-written `interface ClientMessage` beside the schema |
| Literal tuple       | SCREAMING_SNAKE, plural, `as const`; its union type singular PascalCase                                                    | `GAME_ERRORS` / `GameError`, `WIN_RULES` / `WinRule`                                 | `enum GameError`                                           |
| Constant            | SCREAMING_SNAKE. A duration ends in `_MS`, a byte count in `_BYTES`, a length in `_LENGTH`, a count in `_SIZE` or `_CELLS` | `BEAN_ROLL_MS`, `HEARTBEAT_MS`, `MAX_MESSAGE_BYTES`, `ROOM_CODE_LENGTH`, `DECK_SIZE` | `NOTICE_TIME`, `TIMEOUT = 2600`                            |
| Class map           | SCREAMING_SNAKE, singular, keyed by variant name                                                                           | `BUTTON_VARIANT`, `BUTTON_SIZE`, `ART_SIZES`                                         | `buttonClasses`                                            |
| Variable, parameter | camelCase noun                                                                                                             | `room`, `seat`, `thrownAt`                                                           |                                                            |
| Boolean             | An adjective or participle that reads in an `if`                                                                           | `online`, `marked`, `locked`, `interactive`, `connected`, `dev`                      | `isOnline` as a variable                                   |
| Type guard          | `is<Type>`                                                                                                                 | `isLang`, `isWinRule`                                                                | `checkLang`                                                |
| Unused parameter    | Leading `_`                                                                                                                | `(_label, message)`                                                                  |                                                            |
| Private class field | `#name`                                                                                                                    | `#rooms`, `#inbox`                                                                   | `_rooms`, `private rooms`                                  |

## Functions

| Kind                                             | Pattern                           | Examples                                                                                      | Counter-example                                              |
| ------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A move on a game                                 | verb + noun, as the table says it | `drawCard`, `toggleMark`, `claimWin`, `grantClaim`, `rejectClaim`, `addPlayer`, `setRule`     | `handleDraw`, `updateGame`                                   |
| A fresh start                                    | `new<Thing>`                      | `newGame`, `newRound`                                                                         | `createGame`, `resetRound`                                   |
| A derived value                                  | Named for what it returns         | `calledCards`, `claimCells`, `winningCells`, `hostView`, `beanSpot`, `cardArt`, `cardMeaning` | `getCalledCards`, `computeCells`                             |
| Markup                                           | `<thing>Html`                     | `homeHtml`, `tablaHtml`, `currentCardHtml`, `rulePickerHtml`, `offlineBannerHtml`             | `currentCard`, `offlineBanner`                               |
| Spoken text                                      | `<seat>Announcement`              | `hostAnnouncement`, `playerAnnouncement`                                                      |                                                              |
| Browser storage                                  | `load`, `save`, `clear` + noun    | `loadSeat`, `saveSeat`, `clearSeat`, `loadLang`, `saveLang`, `loadName`, `saveName`           | `getSeat`                                                    |
| Something that wires up I/O and returns a handle | `open`, `attach`, `start` + noun  | `openSocket`, `attachHub`, `startServer`                                                      | `initSocket`                                                 |
| A one-expression helper                          | `const` arrow                     | `esc`, `ok`, `fail`, `without`, `unchanged`                                                   |                                                              |
| Anything with a body                             | `function` declaration            | `buttonHtml`, `drawCard`, `render`                                                            | `const send = (ws, message): void => { … }` (`hub.ts:43-45`) |

## Strings that cross a boundary

| Kind                  | Pattern                                                        | Examples                                                                                                                              |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Wire message type `t` | kebab-case, the move or the thing sent                         | `'draw'`, `'new-round'`, `'host-view'`, `'seat'`                                                                                      |
| Error code            | kebab-case, what went wrong                                    | `'claim-pending'`, `'not-on-tabla'`, `'room-not-found'`                                                                               |
| `data-action`         | kebab-case, the same word as the move where there is one       | `'mark'`, `'claim'`, `'rule'`, `'new-round'`, `'share'`; a screen change is `to-<screen>` or the screen's name: `'to-join'`, `'home'` |
| Other `data-*`        | One lowercase word: HTML lowercases attribute names            | `data-card`, `data-player`, `data-lang`, `data-rule`                                                                                  |
| Element `id`          | kebab-case; `-heading` for a heading another element points at | `join-heading`, `rule-heading`, `rule-full`, `host-hint`                                                                              |
| Storage key           | `loteria.<name>.v<n>`; bump `n` when the stored shape changes  | `loteria.seat.v1`, `loteria.lang.v1`, `loteria.name.v1`                                                                               |
| Log line              | Starts `[loteria]` in the browser                              | `'[loteria] server sent non-JSON'`                                                                                                    |
| i18n key              | camelCase, named for the meaning; `said…` for spoken strings   | `claimRejected`, `saidCard`                                                                                                           |

## CSS

| Kind                    | Pattern                                                                | Examples                                               |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| Theme token             | A Tailwind namespace, then the job                                     | `--color-edge`, `--text-card-number`, `--spacing-bean` |
| Runtime custom property | Short, set inline by `render.ts` and documented where the CSS reads it | `--x`, `--turn`, `--roll-ms`, `--roll-elapsed`         |
| `@utility`              | kebab-case: the thing or its state                                     | `bean`, `bean-spot`, `bean-rolling`, `crossed-out`     |
| `@keyframes`            | `<thing>-<motion>`                                                     | `bean-path`, `bean-tumble`                             |

Check: ESLint `@typescript-eslint/no-unused-vars` for the `_` prefix; everything else is review.
