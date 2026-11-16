# Bean

A frijol on a marked card. Two spans: the spot, placed and tilted on the card, and the bean drawn inside it.

## Function and utilities

| Piece                          | Where                | Does                                                                                                          |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `beanHtml(round, id, elapsed)` | `render.ts:268-271`  | The markup, with the spot's custom properties inline; `bean-rolling` while `elapsed` is set                   |
| `beanSpot(round, id)`          | `render.ts:245-265`  | The spot and roll waypoints as custom properties, in % of the card, from the seeded generator                 |
| `bean-spot`                    | `styles.css:44-53`   | Absolute at `--x`, `--y`, tilted `--turn`, `--spacing-bean` wide (38% of the card), 100:64, no pointer events |
| `bean`                         | `styles.css:60-68`   | The SVG drawing, a paper-colored halo that sets it apart from dark art, and its drop shadow                   |
| `bean-rolling`                 | `styles.css:161-170` | The roll, under `prefers-reduced-motion: no-preference`                                                       |

## Custom properties

| Property                                    | Set by                          | Meaning                                                       |
| ------------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| `--x`, `--y`                                | `beanSpot`                      | Rest center, 20-80% of the card                               |
| `--turn`                                    | `beanSpot`                      | Rest tilt, -35 to 35deg                                       |
| `--x0`                                      | `beanSpot`                      | Where it drops in at the top                                  |
| `--x1`/`--y1`, `--x2`/`--y2`, `--x3`/`--y3` | `beanSpot`                      | The first strike, the bounce to the other side, the roll back |
| `--roll-ms`                                 | `beanHtml`, from `BEAN_ROLL_MS` | The roll's length                                             |
| `--roll-elapsed`                            | `beanHtml`                      | How much of the roll has played                               |

## Screen reader

`aria-hidden`. The cell's `aria-pressed` carries the mark.

## Rules

**A bean never blocks its cell.** `pointer-events: none`, so a tap on a bean toggles the cell under it.

- Check: review.

**A bean lies in the same place on every screen.** See [motion](../foundations/motion.md#a-bean-rests-in-the-same-place-everywhere).

- Check: `render.test.ts`.
