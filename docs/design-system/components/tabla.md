# Tabla

A 4x4 board of cards that fills its parent's height. On a player's own phone each cell is a toggle button; on the caller's screen (a claim, a winner) and on a player's winner screen it is a picture.

## Anatomy

```
      +----+ +----+ +----+ +----+
      |12  | |3   | |    | |    |    the number printed on the art, nothing added
      |card| |card| | .. | |    |    each card alone at 8:11, the art's printed frame its only border
      |art | |art | |    | |    |
      +----+ +----+ +----+ +----+    gap-1.5 between cards, and nowhere else
  room left over sits around the board, never between the cards
```

## Function

`tablaHtml(tabla, opts)` (`packages/web/src/render.ts:303-337`).

| Option        | Meaning                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `round`       | Places the [beans](bean.md)                                                      |
| `marked`      | Cards with a bean                                                                |
| `winning`     | Cell indexes that won the tabla, and the label suffix for them                   |
| `notCalled`   | Marked cards the caller never called, and the label suffix for them              |
| `interactive` | Cells are toggle buttons (`data-action="mark"`)                                  |
| `locked`      | The buttons are shown but `disabled`: while a claim is checked, or while offline |
| `rolling`     | Beans still rolling, with how many ms of their roll have played                  |

## Variants

| Use                     | Options                                                     | Cell    |
| ----------------------- | ----------------------------------------------------------- | ------- |
| A player's own tabla    | `interactive`, `locked` while pending or offline, `rolling` | Button  |
| A claim, for the caller | `marked`, `notCalled`, `winning` when the claim wins        | Picture |
| A winner, for everyone  | `marked` (the winning cards), `winning`                     | Picture |

Every variant shows the same card: number, art, bean.

## States

Pressed, locked, winning card, not called: [states](../foundations/states.md).

## Tokens

`--spacing-bean`, `--color-success`, `--color-base-content`.

## Keyboard and screen reader

| Cell    | Contract                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Button  | `aria-pressed` for the bean, `aria-label` the card name, `lang="qu"`. Tab moves cell to cell in row order; Enter and Space toggle |
| Picture | `role="img"`, `aria-label` the card name plus any suffix (", winning card", ", not called"), `lang="qu"`                          |

The bean is `aria-hidden`; the `<img>` has `alt=""`.

## Rules

**Each card is drawn alone, whole.** A card is `aspect-[8/11]`, the art's own shape, so the whole art shows, printed Kichwa name included, and the art's printed frame is its only border. The winning ring and the not-called outline sit on the card, so they hug the art.

- Don't: a border or background around a card, which frames the art's own frame and reads as a card inside a card; `object-cover`, which crops the name.
- Check: `render.test.ts` ("draws each card alone").

**The board takes the cards' shape, not the room's.** The room the screen leaves is a size container in a grid track (`[container-type:size]` on a `flex-1` box would leave `cqh` at 0). Each column is `min((100cqw - gaps) / 4, (100cqh - gaps) / 4 * 8 / 11)`: the widest card for which a full board fits, whichever of width or height runs out first. So the cards always sit together at the one `gap-1.5`, and room left over goes around the board, centered, never between the cards.

- Don't: columns of `1fr` with cards fitted inside each cell, which leaves wide gaps beside short cards.
- Check: `render.test.ts` ("sizes the board to the cards"); at 375x629 a player's card is 81x111px, at 375x568 70x96px.

**A player's card stays a 44px target.** The room's floor (`TABLA_CARD_MIN_HEIGHT`) keeps a player's card at least 44px wide, `2.75rem * 11 / 8` tall; a card that is only looked at, on the caller's screen or a winner's, may go down to `3rem` tall. Below the floor the page scrolls.

- Check: `render.test.ts` ("sizes the board to the cards").

- Check: review.

**The grid comes from `TABLA_SIDE`.** Columns and rows are an inline `style` built from the core constant (`render.ts:334`), the one inline style besides custom properties.

- Don't: `grid-cols-4`, which would disagree with core if the side changed.
- Check: review.
