import { describe, expect, it } from 'vitest';
import { DECK, DECK_SIZE, card } from './cards.js';
import { mulberry32, shuffle } from './rng.js';
import { LINES, TABLA_CELLS, dealTabla, winningCells } from './tabla.js';

describe('deck', () => {
  it('holds the 54 Achik Pukllay cards numbered 1 to 54 as printed', () => {
    expect(DECK_SIZE).toBe(54);
    expect(DECK.map((c) => c.id)).toEqual(Array.from({ length: 54 }, (_, i) => i + 1));
    expect(card(1).name).toBe('Kinti');
    expect(card(28).name).toBe('Lluchu-uma');
    expect(card(54).name).toBe('Kuyi');
  });

  it('gives every card a distinct name', () => {
    expect(new Set(DECK.map((c) => c.name)).size).toBe(54);
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

describe('winningCells', () => {
  // Cards 1..16 in order, so cell i holds card i + 1.
  const tabla = Array.from({ length: 16 }, (_, i) => i + 1);
  const all = new Set(tabla);
  const everyCell = Array.from({ length: 16 }, (_, i) => i);

  describe('one line', () => {
    it('finds a completed row', () => {
      // Row 2 is cells 4..7, holding cards 5..8.
      expect(winningCells(tabla, new Set([5, 6, 7, 8]), all, 'line')).toEqual([4, 5, 6, 7]);
    });

    it('finds a completed column', () => {
      // Column 1 is cells 1, 5, 9, 13, holding cards 2, 6, 10, 14.
      expect(winningCells(tabla, new Set([2, 6, 10, 14]), all, 'line')).toEqual([1, 5, 9, 13]);
    });

    it('finds both diagonals', () => {
      // Cells 0, 5, 10, 15 hold cards 1, 6, 11, 16. Cells 3, 6, 9, 12 hold cards 4, 7, 10, 13.
      expect(winningCells(tabla, new Set([1, 6, 11, 16]), all, 'line')).toEqual([0, 5, 10, 15]);
      expect(winningCells(tabla, new Set([4, 7, 10, 13]), all, 'line')).toEqual([3, 6, 9, 12]);
    });

    it('rejects three of four', () => {
      expect(winningCells(tabla, new Set([5, 6, 7]), all, 'line')).toBeNull();
    });

    it('rejects a marked line containing a card that was never called', () => {
      expect(winningCells(tabla, new Set([5, 6, 7, 8]), new Set([5, 6, 7]), 'line')).toBeNull();
    });

    it('rejects a called line the player never marked', () => {
      expect(winningCells(tabla, new Set(), all, 'line')).toBeNull();
    });
  });

  describe('full tabla', () => {
    it('wins with every cell, once every card is marked and called', () => {
      expect(winningCells(tabla, all, all, 'full')).toEqual(everyCell);
    });

    it('rejects a completed line', () => {
      expect(winningCells(tabla, new Set([5, 6, 7, 8]), all, 'full')).toBeNull();
    });

    it('rejects fifteen of sixteen, by mark or by call', () => {
      const fifteen = new Set(tabla.slice(1));
      expect(winningCells(tabla, fifteen, all, 'full')).toBeNull();
      expect(winningCells(tabla, all, fifteen, 'full')).toBeNull();
    });
  });
});
