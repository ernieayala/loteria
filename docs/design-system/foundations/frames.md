# Frames

Borders, corners, rings, and shadows. The `retro` theme sets `--radius-box: 0.5rem`, `--radius-field: 0.25rem`, `--radius-selector: 0.25rem`, `--border: 1px`, and `--depth: 0` (flat buttons).

## Rules

### Corners come from the theme

| Class          | Radius                       | Use                                                                          |
| -------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `rounded-box`  | `--radius-box`, 0.5rem       | The called row, the claim-sent box; daisyUI's `card` and `alert` read it too |
| daisyUI's own  | `--radius-field`, 0.25rem    | Buttons and text fields                                                      |
| daisyUI's own  | `--radius-selector`, 0.25rem | Badges                                                                       |
| `rounded-full` | A circle                     | The seat dot                                                                 |

- Non-conforming: `rounded-[6px]` on a new panel.

Check: review.

### A thing a player has to find has a 2px edge, unless it brings its own frame

`border-2 border-edge` on the claim-sent box. The card art draws its own hand-drawn frame, so a card takes no border of ours anywhere, on a tabla included: a second frame reads as a card inside a card. Text fields take the edge color at daisyUI's width (`styles.css:216-218`). The join form, a container rather than a target, has a 1px `border-base-300`.

| Frame                                                                                                 | Means                                    |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `border-2 border-edge`                                                                                | A box to read                            |
| `ring-4 ring-success`, hugging the card                                                               | A winning card                           |
| `outline-2 outline-dashed outline-base-content outline-offset-2` with `crossed-out`, hugging the card | A bean on a card the caller never called |

- Non-conforming: `border-2 border-edge` around a tabla card; `border` (1px) on the claim-sent box.

Check: review.

### Shadows lift paper off paper

| Class                                        | Use                                                                |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `shadow`                                     | The join form                                                      |
| `drop-shadow-md`                             | The caller's current card, following the art's transparent corners |
| `shadow-lg`                                  | A notice toast, which floats over the screen                       |
| `drop-shadow(0 1.5px 1px rgb(0 0 0 / 0.35))` | A bean on its card, under its paper halo (`styles.css:67`)         |

Tabla cards have no shadow: sixteen of them read as one board.

- Non-conforming: `shadow-xl` on a tabla card.

Check: review.
