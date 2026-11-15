/**
 * What this browser remembers between visits: the seat it holds, and the name it last joined with.
 *
 * The seat is kept so a reload or a slept phone takes the same seat back. It is saved twice. sessionStorage belongs to one tab, so a caller and a player in two tabs of the same
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

const NAME_KEY = 'loteria.name.v1';

/**
 * The name this browser last joined with, so the next join is one tap. Kept in localStorage only:
 * it belongs to the person holding the phone, not to one tab's seat. Empty when there is none.
 */
export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Storage is blocked; the name is typed again next time.
  }
}
