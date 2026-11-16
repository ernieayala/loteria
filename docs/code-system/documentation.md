# Documentation

## Rules

### A file opens with what it is for

A module whose job rests on a decision the code cannot show opens with a `/** … */` header: what the file is, then the decisions a reader needs before the code (who owns the game, why views are whole, why the page re-renders everything).

- Conforming: `game.ts:1-15`, `protocol.ts:1-12`, `render.ts:1-12`, `session.ts:1-8`, `hub.ts:1-7`.
- Non-conforming: a header that lists the file's exports, which the file already shows.

Where the decision belongs to one export, its JSDoc holds it instead (`startServer`, `staticHandler`, `RoomRegistry`).

Check: review.

### JSDoc says what a thing is and why, in a sentence

One or two sentences on the export, its fields, or its options: what it means in the game, and any rule a caller must know. No `@param` or `@returns` tags: the types say those.

- Conforming: `/** Players whose last claim the caller turned down. Cleared when they play on or a card is called. */` (`game.ts:52`).
- Non-conforming: `/** @param game the game @returns the result */`.

Check: review.

### Comments explain why, never what

A line comment says why the code is as it is, when the code cannot: a browser quirk, a measured limit, a rule of the game.

- Conforming: `// The meanings follow the game's printed word list (Shimikuna), shortened to fit under a card.` (`i18n.ts`).
- Conforming: `// Rows never shrink below 3rem, so a tap target stays above 44px however short the phone.` (`render.ts:320`).
- Non-conforming: `// increment the count`.

Check: review.

### A measurement is stated with its number

A comment that rests on a measurement gives it: "The originals differ by under 2%", "a 20px bold label counts as large text".

Check: review.

### Links use `{@link}`

`{@link esc}`, `{@link Rng}`, `{@link newRound}`.

Check: review.

### Comments state the present

A comment describes the code as it is. No history of fixes, no "used to", no "ported from"; that is git's job.

Check: review.

### Stylesheet comments carry the same weight

Each token group, `@utility`, and unlayered rule in `styles.css` has a comment saying what it is for and what it was measured against.

Check: review.
