# Frames

Borders, corners, rings, and shadows. The `retro` theme sets `--radius-box: 0.5rem`, `--radius-field: 0.25rem`, `--radius-selector: 0.25rem`, `--border: 1px`, and `--depth: 0` (flat buttons).

## Rules

### Corners come from the theme

| Class          | Radius                       | Use                                                                                       |
| -------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `rounded-box`  | `--radius-box`, 0.5rem       | Tabla cells, the called row, the claim-sent box; daisyUI's `card` and `alert` read it too |
| daisyUI's own  | `--radius-field`, 0.25rem    | Buttons and text fields                                                                   |
| daisyUI's own  | `--radius-selector`, 0.25rem | Badges                                                                                    |
| `rounded-sm`   | 0.25rem                      | The number backing on a tabla cell or thumbnail                                           |
| `rounded-full` | A circle                     | The seat dot                                                                              |

- Non-conforming: `rounded-[6px]` on a new panel.

Check: review.

### A thing a player has to find has a 2px edge

`border-2 border-edge` on tabla cells and the claim-sent box. The card art draws its own hand-drawn frame, so the caller's card and the thumbnails take no border. Text fields take the edge color at daisyUI's width (`styles.css:216-218`). The join form, a container rather than a target, has a 1px `border-base-300`.

| Border                                                          | Means                                    |
| --------------------------------------------------------------- | ---------------------------------------- |
| `border-2 border-edge`                                          | A cell, a box to read                    |
| `border-2 border-success ring-4 ring-success/60`                | A winning cell                           |
| `border-2 border-dashed border-base-content` with `crossed-out` | A bean on a card the caller never called |

- Non-conforming: `border` (1px) on a tabla cell.

Check: review.

### Shadows lift paper off paper

| Class                                        | Use                                                                |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `shadow`                                     | The join form                                                      |
| `drop-shadow-md`                             | The caller's current card, following the art's transparent corners |
| `shadow-lg`                                  | A notice toast, which floats over the screen                       |
| `drop-shadow(0 1.5px 1px rgb(0 0 0 / 0.35))` | A bean on its card, under its paper halo (`styles.css:67`)         |

Tabla cells have no shadow: sixteen of them read as one board.

- Non-conforming: `shadow-xl` on a tabla cell.

Check: review.
