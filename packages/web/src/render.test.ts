import { describe, expect, it } from 'vitest';
import { DECK_SIZE, type HostView, type PlayerView, type WinnerView } from '@loteria/core';
import { STRINGS } from './i18n.js';
import { beanSpot, homeHtml, hostHtml, joinHtml, playerAnnouncement, playerHtml } from './render.js';

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
    recent: [],
  };
  /** The card names in the latest-calls row, in order, or undefined when there is no row. */
  const recentRow = (html: string): string[] | undefined => {
    const row = /<ol [^>]*aria-label="(?:Latest calls|Últimas cantadas)[^"]*"[^>]*>([\s\S]*?)<\/ol>/.exec(html)?.[1];
    return row === undefined ? undefined : [...row.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]!);
  };

  it('lets a player mark their tabla while online', () => {
    expect(cellButtons(playerHtml(view, true, 'en', new Map(), null))).toEqual({ enabled: 16, disabled: 0 });
  });

  it('locks the tabla while offline, so a mark is never dropped unsent', () => {
    expect(cellButtons(playerHtml(view, false, 'en', new Map(), null))).toEqual({ enabled: 0, disabled: 16 });
  });

  it('locks the tabla while a claim waits for the caller', () => {
    expect(cellButtons(playerHtml({ ...view, claim: 'pending' }, true, 'en', new Map(), null))).toEqual({
      enabled: 0,
      disabled: 16,
    });
  });

  it('draws every cell with its card art and Kichwa name, and tells the player the rule', () => {
    const html = playerHtml(view, true, 'en', new Map(), null);
    expect(html.match(/<img [^>]*srcset="[^"]*320w[^"]*720w"/g)).toHaveLength(16);
    expect(html).toContain('aria-label="Kinti"');
    expect(html).toContain('Round 1 · Full tabla only');
  });

  it('draws each card alone, with no frame of its own around the art', () => {
    const cells = playerHtml(view, true, 'en', new Map(), null).match(/<button [^>]*data-action="mark"[^>]*>/g) ?? [];
    expect(cells).toHaveLength(16);
    for (const cell of cells) expect(cell).not.toMatch(/\b(border|bg-base|rounded)/);
    // The winning ring sits on the card itself, so it hugs the art.
    const over = { ...view, prize: null, winners: [{ ...lineWinner, playerId: 'p1' }] };
    expect(playerHtml(over, true, 'en', new Map(), null)).toMatch(
      /<div role="img"[^>]*class="[^"]*aspect-\[8\/11\][^"]*ring-4 ring-success/,
    );
  });

  it('sizes the board to the cards, so they sit together at one gap', () => {
    const html = playerHtml(view, true, 'en', new Map(), null);
    expect(html).toContain(
      'grid-template-columns: repeat(4, min((100cqw - 3 * 0.375rem) / 4, (100cqh - 3 * 0.375rem) / 4 * 8 / 11))',
    );
    // A player's card stays a 44px-wide target; a card only looked at may be smaller.
    expect(html).toContain('min-height: calc(4 * calc(2.75rem * 11 / 8) + 3 * 0.375rem)');
    const over = { ...view, prize: null, winners: [lineWinner] };
    expect(playerHtml(over, true, 'en', new Map(), null)).toContain('min-height: calc(4 * 3rem + 3 * 0.375rem)');
  });

  it('shows the latest calls above the tabla, newest first, once a card is called', () => {
    expect(recentRow(playerHtml(view, true, 'en', new Map(), null))).toBeUndefined();
    const html = playerHtml({ ...view, recent: [3, 2, 1] }, true, 'es', new Map(), null);
    expect(recentRow(html)).toEqual(['3, Rakacha', '2, Yanuk', '1, Kinti']);
    expect(html).toMatch(
      /<\/header>[\s\S]*aria-label="Últimas cantadas[\s\S]*aria-label="Tu tabla"[\s\S]*data-action="claim"/,
    );
    expect(cellButtons(html)).toEqual({ enabled: 16, disabled: 0 });
  });

  it('makes each latest call a 44px-wide button around 32px art', () => {
    const html = playerHtml({ ...view, recent: [3, 2] }, true, 'en', new Map(), null);
    // The art is smaller than the caller's, so a 568px-tall phone keeps the shout on screen with the
    // prize banner up; the button around it is still a full touch target.
    expect(html).toMatch(
      /<button type="button" data-action="zoom" data-card="3" aria-pressed="false"[^>]*aria-label="3, Rakacha" class="[^"]*\bw-11\b[^"]*">\s*<span class="block w-8">/,
    );
    expect(html).not.toContain('data-action="unzoom"');
  });

  it('shows a tapped call large with its meaning, over the screen, its thumbnail pressed', () => {
    const html = playerHtml({ ...view, recent: [3, 2] }, true, 'es', new Map(), 2);
    expect(html).toContain('data-card="2" aria-pressed="true"');
    expect(html).toContain('data-card="3" aria-pressed="false"');
    expect(html).toMatch(/<div data-action="unzoom" aria-hidden="true" class="fixed inset-0[\s\S]*alt="2, Yanuk"/);
    expect(html).toContain('<figcaption class="text-center text-2xl font-bold">Cocinero</figcaption>');
    // The tabla stays underneath, unchanged.
    expect(cellButtons(html)).toEqual({ enabled: 16, disabled: 0 });
    // Once the round is over the winner's tabla holds the screen, with no call shown large.
    const over = { ...view, recent: [3, 2], prize: null, winners: [lineWinner] };
    expect(playerHtml(over, true, 'es', new Map(), 2)).not.toContain('data-action="unzoom"');
  });

  it('keeps the latest calls while a claim waits, and drops them once the round is over', () => {
    const pending = playerHtml({ ...view, recent: [1], claim: 'pending' }, true, 'en', new Map(), null);
    expect(recentRow(pending)).toEqual(['1, Kinti']);
    expect(pending).toContain('Sent to the Kawak…');
    const over = { ...view, recent: [1], prize: null, winners: [lineWinner] };
    expect(recentRow(playerHtml(over, true, 'en', new Map(), null))).toBeUndefined();
  });

  it('says each new call, and nothing for a bean', () => {
    const before = { ...view, recent: [1] };
    const after = { ...view, recent: [2, 1] };
    expect(playerAnnouncement(before, after, STRINGS.en)).toBe('Card 2, Yanuk: Cook.');
    expect(playerAnnouncement(after, { ...after, marked: [3] }, STRINGS.en)).toBe('');
  });

  it('tells everyone still playing who got the line and what is in play now', () => {
    const playing = { ...view, rule: 'line-then-full', prize: 'full', winners: [lineWinner] } as const;
    expect(playerHtml(playing, true, 'en', new Map(), null)).toContain(
      'Beto got the line. Keep going for a full tabla.',
    );
    // The line winner reads it about themselves, and keeps their tabla to play for the full one.
    const mine = playerHtml({ ...playing, you: 'p2' }, true, 'en', new Map(), null);
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
    const html = playerHtml({ ...view, prize: null, winners: [lineWinner, fullWinner] }, true, 'en', new Map(), null);
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

  it('shows the join link as a QR code before the first card, and leaves it to Invite after', () => {
    const lobby = hostHtml(view, true, 'en', 'https://example.test');
    expect(lobby).toContain('aria-label="Scan to join: A B C D"');
    expect(lobby).toMatch(/<svg [^>]*viewBox/);
    expect(lobby).not.toContain('https://example.test/?join=ABCD');
    const playing = hostHtml({ ...view, called: [1] }, true, 'en', 'https://example.test');
    expect(playing).not.toContain('<svg');
    expect(playing).not.toContain('https://example.test/?join=ABCD');
    expect(playing).toContain('data-action="share"');
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
    expect(html).toContain('Ronda 1 · Línea y luego tabla llena · 1 cantadas</p>');
    // Players can see the Kawak's screen, so it never says how many cards are left.
    expect(html).not.toContain('quedan');
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

  it('shows the earlier calls under the current card, newest first', () => {
    const html = hostHtml({ ...view, called: [1, 2, 3], remaining: 51 }, true, 'en', '');
    expect(html).toContain('alt="3, Rakacha"');
    expect(html).toMatch(/aria-label="2, Yanuk" class="w-12"[\s\S]*aria-label="1, Kinti" class="w-12"/);
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
