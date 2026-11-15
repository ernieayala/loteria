/**
 * The card art, as the URLs Vite gives each file. `scripts/card-art.js` writes the files: every card
 * at two widths, named `<two-digit id>-<width>.webp`. Vite fingerprints them, so the server caches
 * them for good.
 */

import { DECK, type CardId } from '@loteria/core';

/** The widths each card is drawn at, smallest first. The art is 8:11. */
const WIDTHS = [320, 720] as const;

export interface CardArt {
  /** The smallest width, for an `<img src>`. */
  readonly src: string;
  /** Every width, for an `<img srcset>`. */
  readonly srcset: string;
}

const urls = import.meta.glob<string>('./cards/*.webp', { eager: true, query: '?url', import: 'default' });

const ART = new Map<CardId, CardArt>(
  DECK.map(({ id }) => {
    const files = WIDTHS.map((width) => {
      const url = urls[`./cards/${String(id).padStart(2, '0')}-${width}.webp`];
      if (url === undefined) throw new Error(`No ${width}w art for card ${id}; run npm run card-art`);
      return { url, width };
    });
    return [id, { src: files[0]!.url, srcset: files.map((f) => `${f.url} ${f.width}w`).join(', ') }];
  }),
);

export function cardArt(id: CardId): CardArt {
  const art = ART.get(id);
  if (art === undefined) throw new Error(`No card with id ${id}`);
  return art;
}
