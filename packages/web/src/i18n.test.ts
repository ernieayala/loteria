import { describe, expect, it } from 'vitest';
import { DECK } from '@loteria/core';
import { cardMeaning, pickLang, STRINGS } from './i18n.js';

describe('cardMeaning', () => {
  it.each(Object.entries(STRINGS))('gives every card a meaning in %s, one per card', (_lang, t) => {
    expect(t.cardMeanings).toHaveLength(DECK.length);
    for (const { id } of DECK) expect(cardMeaning(t, id)).not.toBe('');
  });

  it('matches meanings to cards by number', () => {
    expect(cardMeaning(STRINGS.en, 1)).toBe('Hummingbird');
    expect(cardMeaning(STRINGS.es, 54)).toBe('Cuy');
  });

  it('throws for a card outside the deck', () => {
    expect(() => cardMeaning(STRINGS.en, 55)).toThrow();
  });
});

describe('pickLang', () => {
  it('keeps a saved choice over the browser preference', () => {
    expect(pickLang('es', ['en-US'])).toBe('es');
    expect(pickLang('en', ['es-MX', 'es'])).toBe('en');
  });

  it('ignores a saved value that is not a language we have', () => {
    expect(pickLang('fr', ['es-MX'])).toBe('es');
    expect(pickLang('', ['es'])).toBe('es');
  });

  it('takes the first preferred language we have, by primary subtag', () => {
    expect(pickLang(null, ['es-MX', 'en-US'])).toBe('es');
    expect(pickLang(null, ['ES-419'])).toBe('es');
    expect(pickLang(null, ['fr-CA', 'es-US', 'en'])).toBe('es');
    expect(pickLang(null, ['en-GB', 'es'])).toBe('en');
  });

  it('falls back to English when nothing matches', () => {
    expect(pickLang(null, ['fr', 'de'])).toBe('en');
    expect(pickLang(null, [])).toBe('en');
  });
});
