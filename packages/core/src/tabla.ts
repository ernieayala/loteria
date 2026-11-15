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

/** A win a round can award: the first completed line, or a full tabla. */
export const PRIZES = ['line', 'full'] as const;
export type Prize = (typeof PRIZES)[number];

/**
 * What a round awards, chosen by the caller each round. `line-then-full` is the usual table game:
 * the first line wins, play goes on, and the first full tabla wins too.
 */
export const WIN_RULES = ['line-then-full', 'line', 'full'] as const;
export type WinRule = (typeof WIN_RULES)[number];

/** The prizes each rule awards, in the order they are played for. */
export const RULE_PRIZES: Record<WinRule, readonly Prize[]> = {
  'line-then-full': ['line', 'full'],
  line: ['line'],
  full: ['full'],
};

/** The sets of cells that each win a prize, in the order a tie is broken. */
const WINNING_SETS: Record<Prize, readonly (readonly number[])[]> = {
  line: LINES,
  full: [range(TABLA_CELLS)],
};

/** Sixteen distinct cards from the deck. */
export function dealTabla(rng: Rng): CardId[] {
  return shuffle(
    DECK.map((c) => c.id),
    rng,
  ).slice(0, TABLA_CELLS);
}

/**
 * The cells that win the tabla `prize`: the first winning set whose every card was both called and
 * marked, or null.
 *
 * Both conditions define a win: a card the caller never read does not count however it got marked,
 * and a called card the player never marked does not count either. Ties between lines go to the
 * first in {@link LINES} order, so the result is deterministic.
 */
export function winningCells(
  tabla: readonly CardId[],
  marked: ReadonlySet<CardId>,
  called: ReadonlySet<CardId>,
  prize: Prize,
): readonly number[] | null {
  return (
    WINNING_SETS[prize].find((cells) =>
      cells.every((cell) => {
        const id = tabla[cell];
        return id !== undefined && marked.has(id) && called.has(id);
      }),
    ) ?? null
  );
}
