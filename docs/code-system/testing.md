# Testing

Vitest, run by `npm run test` after `tsc --build`. Tests sit beside what they test as `<file>.test.ts`.

## What each package proves

| Package | Tests                                               | Proves                                                                                                                                 |
| ------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| core    | `tabla.test.ts`, `game.test.ts`, `protocol.test.ts` | The deck, shuffling, lines, every move and refusal, what each schema accepts, and that each view carries exactly what its seat may see |
| server  | `hub.test.ts`, `static.test.ts`                     | Whole games over real sockets against a real server on port 0; reconnects; wrong-seat and junk refusals; no path escapes the web root  |
| web     | `render.test.ts`, `i18n.test.ts`                    | Bean placement and paths; language choice                                                                                              |

Screens are checked by eye at phone sizes ([screens](../design-system/patterns/screens.md#checking-a-screen)); no test renders them.

## Rules

### `describe` names the unit

The export under test (`'toggleMark'`, `'beanSpot'`, `'LINES'`), or a short lowercase noun for a feature (`'claims'`, `'views'`, `'deck'`, `'hub'`).

Check: review.

### `it` names one behavior, starting with a verb

Present tense, reading after "it": "refuses a card that is not on the tabla", "never sends a player the calls". A name says what the code does, in the game's words, not how the test checks it.

- Non-conforming: `it('works')`, `it('test toggleMark error')`.

Check: review.

### Table cases use `it.each` with a label

`it.each([['a short code', {...}], …])('rejects %s', …)` (`protocol.test.ts:14-26`), so each case is named in the output.

Check: review.

### Fixtures are built in the test file, small and named

A helper builds exactly the game a test needs and is named for it: `rigged(tabla, called)` deals a known tabla and puts known cards out first (`game.test.ts:25-38`); `hostAndJoin(name)` seats a caller and a player (`hub.test.ts:78-90`). A comment says what a fixture's numbers mean ("Cards 1..4 sit in row 0, cells 0..3").

Check: review.

### Randomness is seeded

`mulberry32(<fixed seed>)` in every test that shuffles or deals.

Check: review.

### Async tests wait on state, never on order

A socket test waits for the message showing the state it needs (`host.next('host-view', (m) => m.view.claims.length === 1)`), never for "the next message": two sockets' messages can arrive in either order (`hub.test.ts:86-88`).

- Non-conforming: `await host.next('host-view')` right after a player's move, expecting that view to show it.

Check: review.

### A test proves the rule, including the refusal

Each move is tested for what it does and for each error it can return. A rule from [the table, not the phone](glossary.md#the-table-not-the-phone) has a test at the layer that keeps it.

Check: review.

### Every server and temp file is cleaned up

`afterAll` closes the server and removes temp folders; each test closes its sockets.

Check: review.
