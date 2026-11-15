import { describe, expect, it } from 'vitest';
import { DECK_SIZE, type HostView, type PlayerView, type WinnerView } from '@loteria/core';
import { beanSpot, homeHtml, hostHtml, joinHtml, playerHtml } from './render.js';

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

/** Every tabla cell button in the markup, by whether it carries `disabled`. */
const cellButtons = (html: string): { enabled: number; disabled: number } => {
  const cells = html.match(/<button [^>]*data-action="mark"[^>]*>/g) ?? [];
  const disabled = cells.filter((tag) => /\sdisabled(\s|>|$)/.test(tag)).length;
  return { enabled: cells.length - disabled, disabled };
};

const TABLA = Array.from({ length: 16 }, (_, i) => i + 1);
const lineWinner: WinnerView = { playerId: 'p2', name: 'Beto', prize: 'line', tabla: TABLA, cells: [0, 1, 2, 3] };

describe('playerHtml', () => {
  const view: PlayerView = {
    code: 'ABCD',
    round: 1,
    rule: 'full',
    prize: 'full',
    winners: [],
    you: 'p1',
    name: 'Ana',
    tabla: TABLA,
    marked: [],
    claim: 'none',
  };

  it('lets a player mark their tabla while online', () => {
    expect(cellButtons(playerHtml(view, true, 'en', new Map()))).toEqual({ enabled: 16, disabled: 0 });
  });

  it('locks the tabla while offline, so a mark is never dropped unsent', () => {
    expect(cellButtons(playerHtml(view, false, 'en', new Map()))).toEqual({ enabled: 0, disabled: 16 });
  });

  it('locks the tabla while a claim waits for the caller', () => {
    expect(cellButtons(playerHtml({ ...view, claim: 'pending' }, true, 'en', new Map()))).toEqual({
      enabled: 0,
      disabled: 16,
    });
  });

  it('draws every cell with its card art and Kichwa name, and tells the player the rule', () => {
    const html = playerHtml(view, true, 'en', new Map());
    expect(html.match(/<img [^>]*srcset="[^"]*320w[^"]*720w"/g)).toHaveLength(16);
    expect(html).toContain('aria-label="Kinti"');
    expect(html).toContain('Round 1 · Full tabla only');
  });

  it('tells everyone still playing who got the line and what is in play now', () => {
    const playing = { ...view, rule: 'line-then-full', prize: 'full', winners: [lineWinner] } as const;
    expect(playerHtml(playing, true, 'en', new Map())).toContain('Beto got the line. Keep going for a full tabla.');
    // The line winner reads it about themselves, and keeps their tabla to play for the full one.
    const mine = playerHtml({ ...playing, you: 'p2' }, true, 'en', new Map());
    expect(mine).toContain('You got the line. Keep going for a full tabla.');
    expect(cellButtons(mine).enabled).toBe(16);
  });

  it('shows the last winning tabla once the round is over, with any earlier winner named', () => {
    const fullWinner: WinnerView = {
      ...lineWinner,
      playerId: 'p1',
      name: 'Ana',
      prize: 'full',
      cells: [...TABLA.keys()],
    };
    const html = playerHtml({ ...view, prize: null, winners: [lineWinner, fullWinner] }, true, 'en', new Map());
    expect(html).toContain('ACHIK PUKLLAY!</span> You filled the tabla');
    expect(html).toContain('Beto got the line');
    expect(cellButtons(html)).toEqual({ enabled: 0, disabled: 0 });
    expect(html.match(/winning card/g)).toHaveLength(16);
  });
});

describe('hostHtml', () => {
  const view: HostView = {
    code: 'ABCD',
    round: 1,
    rule: 'line-then-full',
    prize: 'line',
    winners: [],
    called: [],
    remaining: 54,
    players: [],
    claims: [],
  };
  /** The rule toggles in the markup, as [rule, pressed]. */
  const ruleToggles = (html: string): [string, string][] =>
    [...html.matchAll(/<button [^>]*data-action="rule"[^>]*>/g)].map(([tag]) => [
      /data-rule="([\w-]+)"/.exec(tag)![1]!,
      /aria-pressed="(\w+)"/.exec(tag)![1]!,
    ]);

  it('shows the join link as a QR code before the first card, and as text after', () => {
    const lobby = hostHtml(view, true, 'en', 'https://example.test');
    expect(lobby).toContain('aria-label="Scan to join: A B C D"');
    expect(lobby).toMatch(/<svg [^>]*viewBox/);
    expect(lobby).not.toContain('https://example.test/?join=ABCD');
    const playing = hostHtml({ ...view, called: [1] }, true, 'en', 'https://example.test');
    expect(playing).not.toContain('<svg');
    expect(playing).toContain('https://example.test/?join=ABCD');
  });

  it('offers the rule before the first card, with the current one pressed', () => {
    expect(ruleToggles(hostHtml(view, true, 'en', ''))).toEqual([
      ['line-then-full', 'true'],
      ['line', 'false'],
      ['full', 'false'],
    ]);
    expect(ruleToggles(hostHtml({ ...view, rule: 'full', prize: 'full' }, true, 'en', ''))).toEqual([
      ['line-then-full', 'false'],
      ['line', 'false'],
      ['full', 'true'],
    ]);
  });

  it('shows the drawn card with its meaning, and no rule toggles, once a card is out', () => {
    const html = hostHtml({ ...view, called: [1], remaining: 53 }, true, 'es', '');
    expect(ruleToggles(html)).toEqual([]);
    expect(html).toContain('alt="1, Kinti"');
    expect(html).toContain('<figcaption class="text-center text-2xl font-bold">Colibrí</figcaption>');
    expect(html).toContain('Ronda 1 · Línea y luego tabla llena · 1 cantadas · quedan 53');
  });

  it('plays on after the line, saying who got it, with Next card still the action', () => {
    const html = hostHtml(
      { ...view, called: [1], remaining: 53, prize: 'full', winners: [lineWinner] },
      true,
      'en',
      '',
    );
    expect(html).toContain('Beto got the line. Keep going for a full tabla.');
    expect(html).toContain('data-action="draw"');
  });

  it('judges a claim by the prize in play, and marks a repeat winner', () => {
    const claim = { playerId: 'p1', name: 'Ana', tabla: TABLA, marked: [], wins: 0, cells: null };
    const line = hostHtml({ ...view, claims: [claim] }, true, 'en', '');
    expect(line).toContain('Not valid: no full line was called.');
    expect(line).not.toContain('Already won');
    const full = hostHtml({ ...view, prize: 'full', claims: [{ ...claim, wins: 2 }] }, true, 'en', '');
    expect(full).toContain('Not valid: not every card was called.');
    expect(full).toContain('Already won 2');
  });
});

describe('homeHtml and joinHtml', () => {
  it('offers only the two ways in', () => {
    const actions = [...homeHtml(true, 'en').matchAll(/data-action="([\w-]+)"/g)].map((m) => m[1]);
    expect(actions).toEqual(['lang', 'to-join', 'host']);
  });

  it('asks only for a name when the code came from a link', () => {
    const html = joinHtml({ code: 'ABCD', name: 'Ana', codeGiven: true }, true, 'en');
    expect(html).not.toContain('id="code"');
    expect(html).toContain('value="Ana"');
    expect(joinHtml({ code: '', name: '', codeGiven: false }, true, 'en')).toContain('id="code"');
  });
});
