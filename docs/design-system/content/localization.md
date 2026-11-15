# Localization

Every word the page shows or speaks lives in `packages/web/src/i18n.ts`, in English and Spanish. The server sends codes, never text.

## Structure

| Part          | Rule                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LANGS`       | The languages, as a `const` tuple private to `i18n.ts`; `Lang` is its union, and `isLang` the check other files use                                           |
| `Strings`     | One interface every language implements. A string missing from one language fails `tsc --build`                                                               |
| Groups        | Keys run in screen order, separated by a blank line: connection and errors, home, caller, player, spoken (`said…`)                                            |
| Keys          | camelCase, named for the meaning, not the words: `claimRejected`, not `thatOneDidntCount`                                                                     |
| Interpolation | A string with values is a function with named parameters: `roundStatus: (round, rule, called, left) => …`, `players: (count) => …`                            |
| Errors        | `errors: Record<ErrorCode, string>`, keyed by the server's codes, so every code has a sentence in every language                                              |
| Per rule      | A string that differs by rule or prize is a `Record` keyed by it: `rules` by `WinRule`; `claimValid`, `claimInvalid`, `won`, `youWon`, `keepGoing` by `Prize` |
| Card meanings | `cardMeanings`, one per card in deck order, read through `cardMeaning(t, id)`, which throws for a card with none                                              |

- Conforming: `t.moreClaims(count)`.
- Non-conforming: `` `${count} ${t.moreWaiting}` `` in `render.ts`, which fixes English word order on Spanish.

Check: `tsc --build` for completeness; the rest is review.

## Rules

### One key per meaning

Two places that mean the same thing share a key; two meanings never share one because their English happens to match.

- Conforming: `shout` is the button and the claim heading's ACHIK PUKLLAY!.
- Non-conforming: reusing `round` ("Round 2") as the heading for a round-history panel.

Check: review.

### Escape at the point of use

String functions take values as given. `render.ts` escapes a player's name before passing it into a visible string (`t.won[winner.prize](esc(winner.name))`, `wonText` in `render.ts`); spoken strings take it raw, as the announcer sets `textContent`.

Check: review.

### Card names stay Kichwa and say so

Card names are the Kichwa words printed on the cards. They come from `DECK` in core and are never in `Strings`; learning them is the point of the game. Every element that shows or labels one carries `lang="qu"` (`KICHWA` in `render.ts`): unified Kichwa has no tag of its own, and `qu`, the Quechua macrolanguage, covers it. So does the "Achik Pukllay" title.

Check: review.

### Meanings follow the game's word list

Each language's `cardMeanings` gives the meaning from the printed game's word list (Shimikuna), shortened to a word or two so it fits under the caller's card: "Hummingbird" / "Colibrí". The caller reads the Kichwa name, then the meaning. A spoken card says both: "Card 1, Kinti: Hummingbird."

Check: `i18n.test.ts` (one meaning per card in each language).

### The page says its language

`render()` sets `<html lang>` and the title each time (`main.ts:121-123`).

Check: review.

## Choosing a language

`pickLang(saved, navigator.languages)` (`i18n.ts:393-400`): a saved choice wins, then the first preferred language the app has by primary subtag (`es-MX` counts as Spanish), then English. The switch saves to `localStorage` under `loteria.lang.v1`; when storage is blocked, the choice lasts as long as the page.

Check: `i18n.test.ts` (`pickLang`).

## Adding a language

Add it to `LANGS`, write its `Strings` object, and add it to `STRINGS`. The [language switch](../components/language-switch.md) offers "the other language" and assumes two; a third needs a different control.
