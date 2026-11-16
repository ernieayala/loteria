# Color

Color comes from daisyUI's `retro` theme (`packages/web/src/styles.css:4-6`): warm paper grounds and brown ink, a quiet ground for the card art. The art keeps its own colors; nothing here recolors it. The app changes two of its colors and adds one token. Markup reads colors only through theme classes (`bg-base-100`, `border-success`, `btn-primary`); `render.ts` never names a hex, `oklch`, or `rgb` value.

## Rules

### Markup reads theme roles, never raw colors

- Conforming: `border-base-300 bg-base-100` on the join form (`joinHtml`).
- Non-conforming: `bg-[#ece3ca]` or `style="color: …"` in a render function.

The QR code is drawn black on white (`bg-white text-black`, `qrHtml`) rather than in the theme: it is read by cameras, and black on white is what every one reads best.

The bean (`styles.css:60-68`) is the one place raw colors appear: its SVG cannot read custom properties from inside a `data:` URL. Its rim, `#2b170e`, is checked below. Its halo reads `base-100`, so on any art the rim sits against paper.

Check: review.

### A theme color that fails AA is darkened in the theme, never patched per use

The override keeps the hue and lowers the lightness, in the `daisyui/theme` block (`styles.css:13-18`), so every alert, badge, and button on that role follows.

| Role              | Retro                      | Override                  | Why                                                          |
| ----------------- | -------------------------- | ------------------------- | ------------------------------------------------------------ |
| `--color-info`    | `oklch(58% 0.158 241.966)` | `oklch(48% 0.13 241.966)` | Toasts sit on it with 14px cream text: 3.70:1 becomes 5.68:1 |
| `--color-warning` | `oklch(64% 0.222 41.116)`  | `oklch(50% 0.17 41.116)`  | The reconnecting banner: 3.28:1 becomes 5.77:1               |

- Non-conforming: `alert-info text-black` on one toast.

Check: review. The ratios below were computed from the theme values; no test recomputes them.

### Anything a player has to find is outlined in `edge`, unless it brings its own frame

`--color-edge` is base-content at 70% over its ground (`styles.css:33`). It outlines text fields (`styles.css:216-218`) and the claim-sent box, and clears 3:1 on both paper grounds (WCAG 2.2, 1.4.11). The card art draws its own dark inked frame, so a card carries no outline of ours anywhere: on a tabla, as the current card, or as a thumbnail. A second frame would read as a card inside a card.

- Conforming: `border-2 border-edge` on the claim-sent box (`render.ts:647`).
- Non-conforming: `border-2 border-edge` around a card's art; `border-base-300` on the claim-sent box, too faint to find.

Check: review.

### Every pair meets WCAG 2.2 AA

Text needs 4.5:1, or 3:1 when large (24px, or 18.66px bold). Borders, rings, and focus outlines that carry meaning need 3:1.

- Conforming: `btn-error` is used only at the `action` size (`render.ts:648`), whose label is 20px bold, so its 3.34:1 passes as large text.
- Non-conforming: `btn-error` at `block` or `compact` size: 3.34:1 on normal text fails.

Check: review.

### Color never carries meaning alone

- Conforming: a winning card has a 4px green ring around it, a shape added as well as a color (`render.ts:316`); the chosen rule toggle is filled where the other is only outlined, and says so with `aria-pressed`; a seat offline is a borderless ghost badge where an online seat is outlined, and says ", offline" to a screen reader (`render.ts:349-350`).
- Non-conforming: a card that only turns green.

Check: review.

## Theme roles in use

Hex values are the sRGB rendering of the theme's `oklch` values.

| Role                              | Value                                                   | Hex                                          | Used for                                                                                                                  |
| --------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `base-100`                        | `oklch(91.637% 0.034 90.515)`                           | `#ece3ca`                                    | The join form, the bean's halo, the paper band under the crossed-out stroke, the browser's `theme-color` (`index.html:6`) |
| `base-200`                        | `oklch(88.272% 0.049 91.774)`                           | `#e4d8b4`                                    | The page ground (`index.html:9`)                                                                                          |
| `base-300`                        | `oklch(84.133% 0.065 90.856)`                           | `#dbca9b`                                    | The join form's 1px border                                                                                                |
| `base-content`                    | `oklch(41% 0.112 45.904)`                               | `#793205`                                    | All text, the focus ring, the crossed-out stroke, the dashed not-called outline, the outline button's edge and label      |
| `primary` / `-content`            | `oklch(80% 0.114 19.571)` / `oklch(39% 0.141 25.723)`   | `#ff9fa0` / `#801518`                        | Join, Next card, New round, Grant win, the chosen rule                                                                    |
| `secondary` / `-content`          | `oklch(92% 0.084 155.995)` / `oklch(44% 0.119 151.328)` | `#b7f6cd` / `#00642e`                        | Start a game                                                                                                              |
| `neutral` / `-content`            | `oklch(44% 0.011 73.639)` / `oklch(86% 0.005 56.366)`   | `#56524c` / `#d4d0ce`                        | Invite, Not a win                                                                                                         |
| `error` / `-content`              | `oklch(70% 0.191 22.216)` / `oklch(40% 0.123 38.172)`   | `#ff6266` / `#7c2808`                        | The ACHIK PUKLLAY! button                                                                                                 |
| `success`                         | `oklch(51% 0.096 186.391)`                              | `#00776f`                                    | The winning-card ring, the online dot                                                                                     |
| `info` / `-content` (override)    | `oklch(48% 0.13 241.966)` / `oklch(96% 0.059 95.617)`   | `#0063a0` / `#fef2c6`                        | Notices (toasts)                                                                                                          |
| `warning` / `-content` (override) | `oklch(50% 0.17 41.116)` / `oklch(96% 0.059 95.617)`    | `#ad3300` / `#fef2c6`                        | The reconnecting banner                                                                                                   |
| `edge` (app)                      | base-content at 70%                                     | `#9c6740` on base-100, `#996439` on base-200 | Outlines of things a player has to find; the offline dot                                                                  |

`accent` is not used.

## Contrast pairs

WCAG 2.2 relative luminance, from the hex values above. A translucent color is composited over its ground first.

| #   | Text or mark / ground               | Min       | Ratio | Use                                                         |
| --- | ----------------------------------- | --------- | ----- | ----------------------------------------------------------- |
| 1   | base-content / base-100             | 4.5       | 7.22  | The join form, the crossed-out stroke on its band           |
| 2   | base-content / base-200             | 4.5       | 6.51  | Page text, card meanings, ghost and outline buttons, badges |
| 3   | base-content / base-300             | 4.5       | 5.69  | Text on base-300 (none today)                               |
| 4   | primary-content / primary           | 4.5       | 5.27  | Primary buttons                                             |
| 5   | secondary-content / secondary       | 4.5       | 5.97  | Start a game                                                |
| 6   | neutral-content / neutral           | 4.5       | 5.08  | Invite, Not a win                                           |
| 7   | error-content / error               | 3 (large) | 3.34  | ACHIK PUKLLAY!, 20px bold only                              |
| 8   | info-content / info                 | 4.5       | 5.68  | Notices                                                     |
| 9   | warning-content / warning           | 4.5       | 5.77  | The reconnecting banner                                     |
| 10  | edge / base-100                     | 3         | 3.71  | Text fields                                                 |
| 11  | edge (drawn on base-100) / base-200 | 3         | 3.34  | None today                                                  |
| 12  | edge / base-200                     | 3         | 3.50  | The claim-sent box frame, the offline dot                   |
| 13  | success / base-100                  | 3         | 4.23  | None today                                                  |
| 14  | success / base-200                  | 3         | 3.81  | The winning-card ring on the page, the online dot           |
| 15  | base-content / base-200             | 3         | 6.51  | The focus ring, the outline button's edge                   |
| 16  | bean rim `#2b170e` / base-100       | 3         | 13.32 | A bean's outline against its halo, on any art               |
| 17  | neutral / base-200                  | 3         | 5.47  | A neutral button's edge on the page                         |

The lowest text pair is row 7, which passes only as large text. The lowest non-text pair in use is row 12. The crossed-out stroke and the bean are drawn over art of any color; each carries its own paper band or halo so the pairs above hold wherever they land.

The winning ring is solid `success` and sits on the page between and around the cards, so row 14 carries the state. The dashed not-called outline is base-content on the page, row 15.

The primary, secondary, and error button fills measure 1.38, 1.16, and 2.05 against the page. A button's label names it, so its fill need not reach 3:1 (1.4.11 asks for it only where the boundary is the only cue).
