/**
 * The traditional 54-card Lotería deck in its customary numbering.
 *
 * Emoji stand in for the printed art. The classic deck's illustrations are trademarked, and a glyph
 * renders on every phone without shipping images. Every emoji here is in Unicode 13 or earlier so
 * Windows and older Android draw it.
 */

export type CardId = number;

export interface Card {
  readonly id: CardId;
  readonly name: string;
  readonly emoji: string;
}

export const DECK: readonly Card[] = [
  { id: 1, name: 'El Gallo', emoji: '🐓' },
  { id: 2, name: 'El Diablito', emoji: '😈' },
  { id: 3, name: 'La Dama', emoji: '👒' },
  { id: 4, name: 'El Catrín', emoji: '🎩' },
  { id: 5, name: 'El Paraguas', emoji: '☂️' },
  { id: 6, name: 'La Sirena', emoji: '🧜‍♀️' },
  { id: 7, name: 'La Escalera', emoji: '🪜' },
  { id: 8, name: 'La Botella', emoji: '🍾' },
  { id: 9, name: 'El Barril', emoji: '🛢️' },
  { id: 10, name: 'El Árbol', emoji: '🌳' },
  { id: 11, name: 'El Melón', emoji: '🍈' },
  { id: 12, name: 'El Valiente', emoji: '🗡️' },
  { id: 13, name: 'El Gorrito', emoji: '🧢' },
  { id: 14, name: 'La Muerte', emoji: '⚰️' },
  { id: 15, name: 'La Pera', emoji: '🍐' },
  // Windows has no flag emoji and draws regional indicators as letters, so a plain flag stands in.
  { id: 16, name: 'La Bandera', emoji: '🚩' },
  { id: 17, name: 'El Bandolón', emoji: '🪕' },
  { id: 18, name: 'El Violoncello', emoji: '🎻' },
  { id: 19, name: 'La Garza', emoji: '🦩' },
  { id: 20, name: 'El Pájaro', emoji: '🐦' },
  { id: 21, name: 'La Mano', emoji: '✋' },
  { id: 22, name: 'La Bota', emoji: '👢' },
  { id: 23, name: 'La Luna', emoji: '🌙' },
  { id: 24, name: 'El Cotorro', emoji: '🦜' },
  { id: 25, name: 'El Borracho', emoji: '🍺' },
  { id: 26, name: 'El Negrito', emoji: '🕺' },
  { id: 27, name: 'El Corazón', emoji: '❤️' },
  { id: 28, name: 'La Sandía', emoji: '🍉' },
  { id: 29, name: 'El Tambor', emoji: '🥁' },
  { id: 30, name: 'El Camarón', emoji: '🦐' },
  { id: 31, name: 'Las Jaras', emoji: '🏹' },
  { id: 32, name: 'El Músico', emoji: '🎺' },
  { id: 33, name: 'La Araña', emoji: '🕷️' },
  { id: 34, name: 'El Soldado', emoji: '💂' },
  { id: 35, name: 'La Estrella', emoji: '⭐' },
  { id: 36, name: 'El Cazo', emoji: '🍳' },
  { id: 37, name: 'El Mundo', emoji: '🌎' },
  { id: 38, name: 'El Apache', emoji: '🪶' },
  { id: 39, name: 'El Nopal', emoji: '🌵' },
  { id: 40, name: 'El Alacrán', emoji: '🦂' },
  { id: 41, name: 'La Rosa', emoji: '🌹' },
  { id: 42, name: 'La Calavera', emoji: '💀' },
  { id: 43, name: 'La Campana', emoji: '🔔' },
  { id: 44, name: 'El Cantarito', emoji: '🏺' },
  { id: 45, name: 'El Venado', emoji: '🦌' },
  { id: 46, name: 'El Sol', emoji: '☀️' },
  { id: 47, name: 'La Corona', emoji: '👑' },
  { id: 48, name: 'La Chalupa', emoji: '🛶' },
  { id: 49, name: 'El Pino', emoji: '🌲' },
  { id: 50, name: 'El Pescado', emoji: '🐟' },
  { id: 51, name: 'La Palma', emoji: '🌴' },
  { id: 52, name: 'La Maceta', emoji: '🪴' },
  // The harp emoji is Unicode 16 and missing on most devices.
  { id: 53, name: 'El Arpa', emoji: '🎼' },
  { id: 54, name: 'La Rana', emoji: '🐸' },
];

export const DECK_SIZE = DECK.length;

/** Look up a card. Ids reach here only after boundary validation, so an unknown id is a bug. */
export function card(id: CardId): Card {
  const found = DECK[id - 1];
  if (!found || found.id !== id) throw new Error(`No card with id ${id}`);
  return found;
}
