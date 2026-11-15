# Imagery

The card art is the printed game's own: 54 illustrated cards, each with its number top left and its Kichwa name on a painted band. The app ships that art, a CSS bean, and no icon set; every control is labelled in words.

## Rules

### A card's picture is its printed art, unaltered

The originals are full-resolution PNGs, kept out of git in `cards/` at the repo root (the repo is public). `npm run card-art` (`scripts/card-art.js`) turns them into the WebP files the page ships, in `packages/web/src/cards/`:

| Rule                       | Detail                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two widths per card        | `NN-320.webp` (320x440) and `NN-720.webp` (720x990), named by the two-digit card number. About 25 KB and 90 KB                                    |
| One aspect ratio, 8:11     | Every original is scaled to the same size. The originals differ from 8:11 by under 2%, too little to see                                          |
| Transparent corners kept   | The art's hand-drawn frame has transparent corners; they show the surface beneath                                                                 |
| Served fingerprinted       | `art.ts` imports them through Vite, so the server caches them for good; a missing file fails at page load, naming the card and `npm run card-art` |
| Never cropped or recolored | Every place shows the whole card with `object-contain`: the printed name is part of what a player learns                                          |

Each `<img>` carries `srcset` with both widths and a `sizes` for where it sits (`ART_SIZES` in `render.ts`), so a tabla cell fetches the 320 file and the caller's current card the 720 one on a sharp screen.

- Non-conforming: committing a full-resolution PNG; an `<img>` with only `src`.

Check: `art.ts` throws at load for a missing file; `render.test.ts` checks every cell's `srcset`; the rest is review.

### The name is the label; the picture adds nothing for a screen reader

A tabla cell and a called-row thumbnail carry the card name in `aria-label` (with `role="img"` or as a button), and their `<img>` has `alt=""`. The caller's current card is a plain `<img>` whose `alt` is "number, name". Every element that names a card carries `lang="qu"`.

- Conforming: `calledRowHtml`, `tablaHtml`, `currentCardHtml` (`render.ts`).
- Non-conforming: an `alt` that describes the drawing ("a green hummingbird"), which a learner should get from the word.

Check: review.

### The number has its own backing on small cards

The printed number is too small to read in a tabla cell or a thumbnail, and a bean may land on it. `cardNumberHtml` draws the number again, top left, on a `bg-base-100` backing above the bean. The caller's large card shows the printed number only.

Check: review.

### The bean is a CSS drawing

A kidney-shaped SVG in a `data:` URL, shaded from a highlight to a dark rim, with a light eye and a paper-colored halo so it stands out on dark art (`styles.css`). It is decorative and `aria-hidden`; a marked cell says so with `aria-pressed`. See [bean](../components/bean.md).

Check: review.

### The QR code is the join link, drawn

`qrHtml` draws the join link with `uqr`'s `renderSVG`, black on white with a two-module margin, in a size container so it stays square at whatever room the lobby leaves. It is `role="img"` labelled "Scan to join: A B C D", so a screen reader user hears the code itself, and it is captioned "Scan to join" for everyone.

Check: `render.test.ts` ("shows the join link … as a QR code before the first card"); scanning is review, on a real phone.

### Decorative marks are hidden

The seat dot (`render.ts:318`) and the loading dots (`render.ts:516`) are `aria-hidden`; the words beside them carry the meaning (", offline", "Connecting…").

- Non-conforming: an icon-only button. Every button has a text label.

Check: review.
