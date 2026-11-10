import { describe, expect, it } from 'vitest';
import { DECK_SIZE } from '@loteria/core';
import { beanSpot } from './render.js';

const parse = (style: string): Record<string, number> =>
  Object.fromEntries(
    style.split(';').map((decl) => {
      const [name, value] = decl.split(':');
      return [name!, parseFloat(value!)];
    }),
  );

describe('beanSpot', () => {
  it('lands every bean with its center inside the middle 60% of the card', () => {
    for (let round = 1; round <= 20; round++) {
      for (let id = 1; id <= DECK_SIZE; id++) {
        const spot = parse(beanSpot(round, id));
        expect(spot['--x']).toBeGreaterThanOrEqual(20);
        expect(spot['--x']).toBeLessThanOrEqual(80);
        expect(spot['--y']).toBeGreaterThanOrEqual(20);
        expect(spot['--y']).toBeLessThanOrEqual(80);
      }
    }
  });

  it('rolls every bean along a path that stays on the card and bounces from one side to the other', () => {
    for (let round = 1; round <= 20; round++) {
      for (let id = 1; id <= DECK_SIZE; id++) {
        const spot = parse(beanSpot(round, id));
        for (const name of ['--x0', '--x1', '--y1', '--x2', '--y2', '--x3', '--y3']) {
          expect(spot[name]).toBeGreaterThanOrEqual(15);
          expect(spot[name]).toBeLessThanOrEqual(85);
        }
        // The first strike is on one side of the card and the bounce lands on the other.
        expect((spot['--x1']! - 50) * (spot['--x2']! - 50)).toBeLessThan(0);
      }
    }
  });

  it('puts a bean in the same place every time, and elsewhere for another card or round', () => {
    expect(beanSpot(3, 17)).toBe(beanSpot(3, 17));
    expect(beanSpot(3, 17)).not.toBe(beanSpot(3, 18));
    expect(beanSpot(3, 17)).not.toBe(beanSpot(4, 17));
  });

  it('spreads beans across the box rather than bunching them', () => {
    const xs = Array.from({ length: DECK_SIZE }, (_, i) => parse(beanSpot(1, i + 1))['--x']!);
    expect(Math.min(...xs)).toBeLessThan(30);
    expect(Math.max(...xs)).toBeGreaterThan(70);
  });
});
