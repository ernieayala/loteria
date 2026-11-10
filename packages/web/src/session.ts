/**
 * The seat this browser holds, kept so a reload or a slept phone takes the same seat back.
 *
 * Saved twice. sessionStorage belongs to one tab, so a caller and a player in two tabs of the same
 * browser each reload into their own seat. localStorage outlives the tab, so a phone whose browser
 * discarded the tab still finds its seat. Either store can be missing or throw on access (private
 * windows, blocked site data); then the seat lasts as long as the page and nothing else breaks.
 */

import { SeatMessageSchema, type SeatMessage } from '@loteria/core';

const KEY = 'loteria.seat.v1';
const STORES = ['sessionStorage', 'localStorage'] as const;

/** Run `use` against each store in turn, skipping any that throws. */
function eachStore(use: (store: Storage) => boolean | void): void {
  for (const name of STORES) {
    try {
      if (use(window[name]) === true) return;
    } catch {
      // This store is unavailable or holds junk; the other may still work.
    }
  }
}

export function loadSeat(): SeatMessage | null {
  let seat: SeatMessage | null = null;
  eachStore((store) => {
    const raw = store.getItem(KEY);
    const parsed = raw ? SeatMessageSchema.safeParse(JSON.parse(raw)) : null;
    if (parsed?.success) seat = parsed.data;
    return seat !== null;
  });
  return seat;
}

export function saveSeat(seat: SeatMessage): void {
  eachStore((store) => store.setItem(KEY, JSON.stringify(seat)));
}

export function clearSeat(): void {
  eachStore((store) => store.removeItem(KEY));
}
