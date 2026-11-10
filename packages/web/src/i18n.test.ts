import { describe, expect, it } from 'vitest';
import { pickLang } from './i18n.js';

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
