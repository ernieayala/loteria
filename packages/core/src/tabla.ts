import { DECK, type CardId } from './cards.js';
import { type Rng, shuffle } from './rng.js';

/** A tabla is a 4x4 grid stored row-major: cell `r * 4 + c`. */
export const TABLA_SIDE = 4;
export const TABLA_CELLS = TABLA_SIDE * TABLA_SIDE;

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** Every winning line as cell indexes: four rows, four columns, two diagonals. */
export const LINES: readonly (readonly number[])[] = [
  ...range(TABLA_SIDE).map((r) => range(TABLA_SIDE).map((c) => r * TABLA_SIDE + c)),
  ...range(TABLA_SIDE).map((c) => range(TABLA_SIDE).map((r) => r * TABLA_SIDE + c)),
  range(TABLA_SIDE).map((i) => i * TABLA_SIDE + i),
  range(TABLA_SIDE).map((i) => i * TABLA_SIDE + (TABLA_SIDE - 1 - i)),
];

/** Sixteen distinct cards from the deck. */
export function dealTabla(rng: Rng): CardId[] {
  return shuffle(
    DECK.map((c) => c.id),
    rng,
  ).slice(0, TABLA_CELLS);
}

/**
 * The first line on the tabla whose every card was both called and marked, or null.
 *
 * Both conditions define a Lotería: a card the caller never read does not count however it got
 * marked, and a called card the player never marked does not count either. Ties between lines go to
 * the first in {@link LINES} order, so the result is deterministic.
 */
export function winningLine(
  tabla: readonly CardId[],
  marked: ReadonlySet<CardId>,
  called: ReadonlySet<CardId>,
): readonly number[] | null {
  return (
    LINES.find((line) =>
      line.every((cell) => {
        const id = tabla[cell];
        return id !== undefined && marked.has(id) && called.has(id);
      }),
    ) ?? null
  );
}
