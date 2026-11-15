/**
 * The 54-card Achik Pukllay deck, numbered as printed. Each name is the Kichwa word on the card,
 * spelled as the card prints it. The pictures live in the web package; what each word means is
 * page copy, in its i18n file.
 */

export type CardId = number;

export interface Card {
  readonly id: CardId;
  readonly name: string;
}

const NAMES = [
  'Kinti',
  'Yanuk',
  'Rakacha',
  'Kuychi',
  'Mishki Mama',
  'Kucha',
  'Amaru',
  'Killa',
  'Kushipata',
  'Inti',
  'Sara',
  'Chakana',
  'Mama Ruka',
  'Wasi',
  'Tsutu',
  'Kiwa',
  'Rumi',
  'Challwa',
  'Punku',
  'Mukawa',
  'Kipu',
  'Puyu',
  'Uchu',
  'Kamcha',
  'Kancha',
  'Sacha',
  'Urku',
  'Lluchu-uma',
  'Akcha',
  'Misi',
  'Wawa',
  'Tanta',
  'Pupu',
  'Wallka',
  'Tamya',
  'Sisa',
  'Nina',
  'Maki',
  'Chanka',
  'Api',
  'Katsu',
  'Atallpa',
  'Raymi',
  'Muyu',
  'Chiri',
  'Kuyllur',
  'Chiwilla',
  'Kurikinka',
  'Kiwayaku',
  'Tullu',
  'Mucha',
  'Shuwa',
  'Shunku',
  'Kuyi',
] as const;

export const DECK: readonly Card[] = NAMES.map((name, i) => ({ id: i + 1, name }));

export const DECK_SIZE = DECK.length;

/** Look up a card. Ids reach here only after boundary validation, so an unknown id is a bug. */
export function card(id: CardId): Card {
  const found = DECK[id - 1];
  if (!found || found.id !== id) throw new Error(`No card with id ${id}`);
  return found;
}
