# Called row

The caller's earlier calls, newest first, in one row of thumbnails that scrolls sideways.

## Function

`calledRowHtml(ids, t)` (`packages/web/src/render.ts`): an `<ol>`, `overflow-x-auto`, `gap-1.5`. Each item is a 48px-wide (`w-12`) thumbnail of the card art at 8:11, with the card number on its own backing top left (`cardNumberHtml`). Renders nothing when there are no earlier calls.

## Keyboard and screen reader

The list has `tabindex="0"` so a keyboard can reach and scroll it, and `aria-label` "Called before, newest first". Each thumbnail is `role="img"` with `aria-label` "number, name" and `lang="qu"`; its `<img>` has `alt=""`.

## Rules

**It never pushes the page down.** One row, scrolling sideways, however many cards are out.

- Don't: `flex-wrap`.
- Check: review.

**It gives way to a tabla.** While a winner's tabla or a claim is on screen, the row is not rendered (`render.ts:606-609`): the tabla needs the room more than the history does.

- Check: review.

**The current card is not in it.** `hostHtml` splits `[current, ...earlier]` from the reversed calls (`render.ts:571`).

- Check: review.
