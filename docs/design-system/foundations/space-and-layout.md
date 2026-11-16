# Space and layout

## The column

Every screen renders into `#app` (`packages/web/index.html:14-17`): one centered column, `max-w-md` wide, `min-h-svh` tall, `gap-3` between rows, a `px-3` gutter, and top and bottom padding of `max(0.75rem, env(safe-area-inset-*))` so nothing sits under a notch or a home bar.

| Rule                                           | Detail                                                                                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `min-h-svh`, never `h-svh`                     | The small viewport is the height with the browser's bars showing, so a turn fits without a scroll. `min-h` lets zoomed text grow the page instead of clipping it     |
| Fixed rows, one flexible area, the action last | Header and status rows take their own height; one area takes `flex-1` (the current card, the tabla, the winner's tabla, a claim); the main action sits at the bottom |
| The flexible area has a floor                  | `min-h-40` on the card-face slot (`render.ts:157`); tabla rows never below `3rem` (`render.ts:321`). Below the floor the page scrolls                                |

- Conforming: `playerHtml` is a header, the tabla section with `flex-1`, then the row with Last card and the ACHIK PUKLLAY! button (`render.ts:655-685`).
- Non-conforming: a second `flex-1` area on the same screen, which splits the room and leaves the tabla too short.

Check: review, and the phone-size pass in [screens](../patterns/screens.md#checking-a-screen).

## Space steps

Tailwind's spacing scale, in these steps:

| Step      | Use                                                                             |
| --------- | ------------------------------------------------------------------------------- |
| `p-0.5`   | The art inside a tabla cell, clear of the cell's border                         |
| `gap-1`   | A label and its field; the caller's header buttons; a card face and its meaning |
| `gap-1.5` | Items in a list or grid: tabla cells, called cards, seat badges                 |
| `gap-2`   | Items in a header row; a heading and what follows it; the rule toggles          |
| `gap-3`   | Rows of the column; fields in the join form                                     |
| `gap-4`   | The two choices on the home screen                                              |
| `p-4`     | The join form card                                                              |

- Non-conforming: `gap-[5px]`.

Check: review.

## Targets

| Target          | Size                                            | Where                                                                               |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Any button      | At least 44px tall                              | `.btn { min-height: 2.75rem }` (`styles.css:211-213`), over daisyUI's 32px `btn-sm` |
| A tabla cell    | At least 48px tall, a quarter of the tabla wide | `minmax(3rem, 1fr)` rows (`render.ts:321`)                                          |
| The main action | 56px tall, the full width its row leaves        | `h-14 w-full` in `BUTTON_SIZE.action` (`render.ts:61`)                              |

- Non-conforming: a `btn-xs` in a header, or a clickable `<span>`.

Check: review.

## Container units

A tabla cell sets `[container-type:inline-size]`, so `cqw` inside it is 1% of the cell's width and the bean scales with the card it lies on.

A card face (the caller's current card, a player's last card) fills the slot the screen leaves. Its slot is a grid track, and the `<figure>` in it is `[container-type:size]` (`currentCardHtml`): size containment gives the figure no size of its own, so the art's pixels cannot set the slot's height, and the grid track gives it a settled size to fill. The art inside is `size-full object-contain`. Measured at 320x568, 375x667, and 412x780: the screen fits with no scroll, Next card included.

- Non-conforming: `[container-type:size]` on a `flex-1` item; an `<img>` in the current-card slot without a size container around it, which pushes the main action off the screen.

Check: review.
