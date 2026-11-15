# Room code

Four letters that seat a phone in a room. Shown large on the caller's screen and small in a player's header, and typed in the join form.

## Function

`roomCodeHtml(code)` (`packages/web/src/render.ts:43-44`): the code `aria-hidden`, and beside it an `sr-only` copy spelled letter by letter (`"A B C D"`), so a screen reader says the letters rather than trying a word.

## Looks

| Where               | Classes                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The caller's header | `font-mono text-4xl leading-tight font-black tracking-[0.2em]`, with the join link under it in `text-xs break-all` once the first card is out; before that the lobby's QR code carries the link |
| A player's header   | `font-mono font-bold` inside "Room ABCD · Round 2"                                                                                                                                              |
| The join field      | `font-mono tracking-[0.3em] uppercase`, see [text field](text-field.md)                                                                                                                         |

## Rules

**Codes use the room alphabet.** No I, L, or O: called across a room they are heard and typed as 1 and 0 (`packages/server/src/rooms.ts:18-19`). The length is `ROOM_CODE_LENGTH` from core.

- Check: `protocol.test.ts` (the schema rejects a short code); the alphabet is review.

**A code a screen reader meets is spelled.** Every displayed code goes through `roomCodeHtml`.

- Don't: `${view.code}` straight into a header.
- Check: review.
