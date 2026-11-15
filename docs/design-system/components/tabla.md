# Tabla

A 4x4 board of cards that fills its parent's height. On a player's own phone each cell is a toggle button; on the caller's screen (a claim, a winner) and on a player's winner screen it is a picture.

## Anatomy

```
+------+------+------+------+
|[12]  |[3]   |      |      |   number on its own backing, above the bean
| card | card |  ... |      |   the whole card art, object-contain, printed name included
| art  | art  |      |      |
+------+------+------+------+   gap-1.5, rows minmax(3rem, 1fr)
```

## Function

`tablaHtml(tabla, opts)` (`packages/web/src/render.ts:283-309`).

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

Every variant shows the same cell: number, art, bean.

## States

Pressed, locked, winning card, not called: [states](../foundations/states.md).

## Tokens

`--text-card-number`, `--spacing-bean`, `--color-edge`, `--color-success`, `--color-base-content`, `--radius-box`.

## Keyboard and screen reader

| Cell    | Contract                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Button  | `aria-pressed` for the bean, `aria-label` the card name, `lang="qu"`. Tab moves cell to cell in row order; Enter and Space toggle |
| Picture | `role="img"`, `aria-label` the card name plus any suffix (", winning card", ", not called"), `lang="qu"`                          |

The number and the bean are `aria-hidden`; the `<img>` has `alt=""`.

## Rules

**The number stays readable under a bean.** It sits on its own `bg-base-100` backing at `z-10` (`cardNumberHtml`), so wherever a bean lands the caller can read it to check a tabla.

- Check: review.

**The cell shows the whole card.** The art is `absolute inset-0` with `object-contain`, so the printed Kichwa name is always in view; the cell's size comes from the grid, never from the art.

- Don't: `object-cover`, which crops the name on short wide phones.
- Check: review; at 375x667 a cell is about 83x125px and the printed name reads.

**Rows never go below 3rem,** so a cell stays a 44px target however short the phone.

- Check: review.

**The grid comes from `TABLA_SIDE`.** Columns and rows are an inline `style` built from the core constant (`render.ts:308`), the one inline style besides custom properties.

- Don't: `grid-cols-4`, which would disagree with core if the side changed.
- Check: review.
