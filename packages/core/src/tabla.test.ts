import { describe, expect, it } from 'vitest';
import { DECK, DECK_SIZE, card } from './cards.js';
import { mulberry32, shuffle } from './rng.js';
import { LINES, TABLA_CELLS, dealTabla, winningLine } from './tabla.js';

describe('deck', () => {
  it('holds the 54 traditional cards numbered 1 to 54 in order', () => {
    expect(DECK_SIZE).toBe(54);
    expect(DECK.map((c) => c.id)).toEqual(Array.from({ length: 54 }, (_, i) => i + 1));
    expect(card(1).name).toBe('El Gallo');
    expect(card(54).name).toBe('La Rana');
  });

  it('gives every card a distinct name and a distinct emoji', () => {
    expect(new Set(DECK.map((c) => c.name)).size).toBe(54);
    expect(new Set(DECK.map((c) => c.emoji)).size).toBe(54);
  });

  it('throws on an id outside the deck', () => {
    expect(() => card(0)).toThrow();
    expect(() => card(55)).toThrow();
  });
});

describe('shuffle', () => {
  it('returns a permutation and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, mulberry32(7));
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('repeats exactly for the same seed', () => {
    const ids = DECK.map((c) => c.id);
    expect(shuffle(ids, mulberry32(42))).toEqual(shuffle(ids, mulberry32(42)));
    expect(shuffle(ids, mulberry32(42))).not.toEqual(shuffle(ids, mulberry32(43)));
  });
});

describe('LINES', () => {
  it('lists four rows, four columns, and two diagonals of a row-major 4x4 grid', () => {
    // Grid cells:  0  1  2  3 /  4  5  6  7 /  8  9 10 11 / 12 13 14 15
    expect(LINES).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
      [0, 4, 8, 12],
      [1, 5, 9, 13],
      [2, 6, 10, 14],
      [3, 7, 11, 15],
      [0, 5, 10, 15],
      [3, 6, 9, 12],
    ]);
  });
});

describe('dealTabla', () => {
  it('deals 16 distinct cards from the deck', () => {
    const tabla = dealTabla(mulberry32(1));
    expect(tabla).toHaveLength(TABLA_CELLS);
    expect(new Set(tabla).size).toBe(16);
    for (const id of tabla) expect(id >= 1 && id <= 54).toBe(true);
  });
});

describe('winningLine', () => {
  // Cards 1..16 in order, so cell i holds card i + 1.
  const tabla = Array.from({ length: 16 }, (_, i) => i + 1);
  const all = new Set(tabla);

  it('finds a completed row', () => {
    // Row 2 is cells 4..7, holding cards 5..8.
    expect(winningLine(tabla, new Set([5, 6, 7, 8]), all)).toEqual([4, 5, 6, 7]);
  });

  it('finds a completed column', () => {
    // Column 1 is cells 1, 5, 9, 13, holding cards 2, 6, 10, 14.
    expect(winningLine(tabla, new Set([2, 6, 10, 14]), all)).toEqual([1, 5, 9, 13]);
  });

  it('finds both diagonals', () => {
    // Cells 0, 5, 10, 15 hold cards 1, 6, 11, 16. Cells 3, 6, 9, 12 hold cards 4, 7, 10, 13.
    expect(winningLine(tabla, new Set([1, 6, 11, 16]), all)).toEqual([0, 5, 10, 15]);
    expect(winningLine(tabla, new Set([4, 7, 10, 13]), all)).toEqual([3, 6, 9, 12]);
  });

  it('rejects three of four', () => {
    expect(winningLine(tabla, new Set([5, 6, 7]), all)).toBeNull();
  });

  it('rejects a marked line containing a card that was never called', () => {
    expect(winningLine(tabla, new Set([5, 6, 7, 8]), new Set([5, 6, 7]))).toBeNull();
  });

  it('rejects a called line the player never marked', () => {
    expect(winningLine(tabla, new Set(), all)).toBeNull();
  });
});
