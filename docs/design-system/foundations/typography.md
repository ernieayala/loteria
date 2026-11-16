# Typography

Two font stacks, both Tailwind's defaults: `font-sans` (the system UI face, so no font downloads to a phone at the table) for everything, and `font-mono` for room codes. Sizes come from Tailwind's rem scale, so a player's text-size setting applies everywhere. A card's name and number are printed on its art; the page adds only the number on small cards and the meaning under the caller's card.

## Rules

### Screen text uses the rem scale

- Conforming: `text-sm` on the round status (`render.ts:605`).
- Non-conforming: `text-[13px]`, which ignores the reader's text size.

Check: review.

### The card number reads a card token

| Token                | Value    | Use                                                                                                                           |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--text-card-number` | `0.7rem` | A tabla cell's or thumbnail's number, on its own backing above the bean; fixed so it stays legible on any card (`styles.css`) |

- Conforming: `text-card-number` in `cardNumberHtml` (`render.ts`).
- Non-conforming: `text-[0.7rem]`, a raw value where a token belongs.

Check: review.

### The ramp

| Classes                                           | Use                                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `text-4xl font-black tracking-tight`              | The "Achik Pukllay" title on the home screen                                                                                                    |
| `font-mono text-2xl font-black tracking-[0.15em]` | The caller's room code, kept small so the caller's header is one row                                                                            |
| `text-2xl font-bold`                              | The meaning under a card face                                                                                                                   |
| `text-xl font-black`                              | The winner heading, the claim heading                                                                                                           |
| `text-xl font-bold`                               | The main action's label (`BUTTON_SIZE.action`), the claim-sent box                                                                              |
| `text-lg font-bold`                               | Section headings (Join a game), a player's own name                                                                                             |
| `font-semibold`                                   | The rule picker's heading                                                                                                                       |
| base                                              | Body copy: the tagline, the waiting line, player feedback, the lobby's first-card prompt, the prize status, the line under a home-screen choice |
| `text-sm`                                         | Field labels (`font-medium`), hints, the round status, the claim verdict (`font-semibold`), the offline banner                                  |
| `text-xs`                                         | The "Room code" label over the caller's code (`font-semibold`); the Players heading (`font-semibold tracking-wide uppercase`)                   |

Weights: `font-black` for display headings, `font-bold` for headings, numbers, card meanings and the main action, `font-semibold` for verdicts and small headings, `font-medium` for field labels.

Check: review.

### Case

Copy is sentence case ([voice](../content/voice.md)). Two things are upper case on screen: room codes, typed or shown (`uppercase` on the field, `render.ts:522`), and the Players label (`render.ts:589`). ACHIK PUKLLAY is upper case in the copy itself, not by a class.

- Non-conforming: `uppercase` on a button label.

Check: review.

### Long text wraps or truncates, and stays whole for screen readers

| Text                                    | Behavior                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| A player's name in their own header     | `truncate` on one line (`render.ts:657`)                                          |
| A claimant's name in the claim heading  | `truncate`; the heading's `aria-label` holds the whole name (`render.ts:396-397`) |
| A card's meaning under a card face      | Wraps between words, centered                                                     |
| A seat's name in the caller's seat list | One line (`whitespace-nowrap`); the list scrolls sideways (`render.ts:334`)       |
| Anything else                           | Wraps between words                                                               |

- Non-conforming: `truncate` on copy a player must read in full, such as the claim verdict.

Check: review.
