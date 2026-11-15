# States

One look per state across the app. The element's own attribute (`disabled`, `aria-pressed`) carries the state; a class only styles it.

| State                                   | Look                                                                                                                                                                         | Carried by                                    | Where                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Focus                                   | A 3px `base-content` outline, 2px out                                                                                                                                        | `:focus-visible`                              | `styles.css:205-208`, every control                                                                        |
| Pressed (a marked cell)                 | A bean on the card                                                                                                                                                           | `aria-pressed="true"` on the cell button      | `render.ts:292`, `:303`                                                                                    |
| Pressed (the chosen rule)               | The toggle is filled (`primary`); the other is outlined (`outline`)                                                                                                          | `aria-pressed` on each rule toggle            | `rulePickerHtml`                                                                                           |
| Pressing                                | The cell shrinks to 95%                                                                                                                                                      | `:active`, motion allowed                     | `render.ts:300`                                                                                            |
| Disabled                                | daisyUI's disabled button                                                                                                                                                    | `disabled`                                    | `buttonHtml`, when the socket is offline                                                                   |
| Locked (a tabla that cannot change now) | The cells stay as they are but cannot be pressed, and lose the pointer and press look                                                                                        | `disabled` on every cell                      | `render.ts:292`, `:300`, while `claim === 'pending'` or offline                                            |
| Offline (the page)                      | The reconnecting banner on top; Join, Join a game, Start a game, the rule toggles, Next card, New round, Grant win, Not a win, and ACHIK PUKLLAY! disabled; the tabla locked | `online === false`                            | `offlineBannerHtml`, `render.ts:398-399`                                                                   |
| Offline (a seat)                        | A borderless badge with an `edge` dot instead of an outlined one with a `success` dot                                                                                        | ", offline" in an `sr-only` span              | `render.ts:317-318`                                                                                        |
| Winning card                            | A green 2px border and a 4px ring, on every cell that won (a line, or the whole tabla)                                                                                       | ", winning card" appended to the cell's label | `render.ts:288`, `:296`                                                                                    |
| Not called                              | Struck through corner to corner in ink on a paper band, over the art and the bean; dashed border                                                                             | ", not called" appended to the cell's label   | `render.ts:289`, `:298`; `crossed-out`, `styles.css:178-196`                                               |
| Waiting                                 | "Sent to the Kawak…" in a framed box where the button was                                                                                                                    | The text                                      | `render.ts:607-609`                                                                                        |
| Turned down                             | "That one didn't count. Keep playing." above the button                                                                                                                      | The text                                      | `render.ts:610`                                                                                            |
| Connecting                              | Loading dots                                                                                                                                                                 | "Connecting…" in an `sr-only` span            | `waitingHtml`, `render.ts:513-518`                                                                         |
| Empty                                   | A sentence saying what to do                                                                                                                                                 | The text                                      | "Nobody yet. Share the code to invite players." (`render.ts:314`); the first-card prompt (`render.ts:211`) |

## Rules

### One focus ring for every control

The ring is unlayered CSS in `base-content`, so it wins over daisyUI's per-button rings without a specificity fight. daisyUI draws each button's ring in that button's own color, which nearly vanishes for a pastel button on this paper.

- Non-conforming: `focus:ring-primary` on a button.

Check: review.

### Focus survives a render

Every render replaces the page. `render()` (`main.ts:105-128`) finds the focused control again by its `id`, or by `data-action` plus `data-card`, and restores focus and the text selection. A control a player can focus has one of these.

- Conforming: tabla cells carry `data-action="mark" data-card="…"`; the rule toggles carry `id="rule-line-then-full"`, `id="rule-line"`, and `id="rule-full"`, since they share one action.
- Non-conforming: a focusable element with neither, which sends a keyboard user back to the top each time a card is called.

Check: review.

### A state that changes the meaning of a cell is in its label

A cell not marked by its button state gets its label suffix: ", winning card", ", not called" (`i18n.ts`). The suffix starts with a comma and a space, so it reads after the card name.

Check: review.

### Disabled means "cannot now", with the reason on screen

The reconnecting banner says why the actions and the tabla are disabled; "Sent to the Kawak…" says why the tabla is locked while a claim waits.

- Non-conforming: a disabled button with no visible reason.

Check: review.
