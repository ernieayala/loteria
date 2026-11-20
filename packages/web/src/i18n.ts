/**
 * Every word the page shows or speaks, in English and Spanish.
 *
 * Card names stay in Kichwa in both languages: learning them is the point of the game, and the Kawak
 * reads each aloud before its meaning. What each card means is here, per language. Server errors
 * arrive as codes, so their wording lives here too. A player's choice is kept in localStorage; with
 * none saved, the browser's preferred languages decide.
 */

import type { CardId, ErrorCode, Prize, WinRule } from '@loteria/core';

const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];

export interface Strings {
  /** This language's own name, shown on the switch that selects it. */
  readonly languageName: string;
  /** What each card means, card 1 first. Read through {@link cardMeaning}. */
  readonly cardMeanings: readonly string[];
  readonly rules: Record<WinRule, string>;
  readonly errors: Record<ErrorCode, string>;
  readonly title: (code: string | null) => string;
  readonly reconnecting: string;
  readonly connecting: string;
  readonly connectionLost: string;

  readonly tagline: string;
  readonly joinChoice: string;
  readonly joinChoiceHint: string;
  readonly startChoice: string;
  readonly startChoiceHint: string;
  readonly back: string;
  readonly joinHeading: string;
  readonly joinRoom: (code: string) => string;
  readonly roomCode: string;
  readonly roomCodeHint: (letters: number) => string;
  readonly yourName: string;
  readonly join: string;

  readonly scanToJoin: string;
  readonly invite: string;
  readonly inviteText: (code: string) => string;
  readonly linkCopied: string;
  readonly copyFailed: string;
  readonly endGame: string;
  readonly confirmEndGame: string;
  readonly players: (count: number) => string;
  readonly noPlayers: string;
  readonly offline: string;
  readonly currentCard: string;
  readonly ruleHeading: string;
  readonly firstCardPrompt: string;
  readonly callsSoFar: string;
  /** No count of the cards left: players can see the Kawak's screen, and a count would tell them how long the round may run. */
  readonly roundStatus: (round: number, rule: string, called: number) => string;
  readonly calledBefore: string;
  readonly nextCard: string;
  readonly newRound: string;
  readonly confirmNewRound: string;
  readonly claimValid: Record<Prize, string>;
  readonly claimInvalid: Record<Prize, string>;
  readonly wonBefore: (count: number) => string;
  readonly moreClaims: (count: number) => string;
  readonly notCalled: string;
  readonly grantWin: string;
  readonly notAWin: string;

  readonly room: string;
  readonly round: (round: number) => string;
  readonly leave: string;
  readonly confirmLeave: string;
  readonly yourTabla: string;
  /** The row of the latest calls above a player's tabla. */
  readonly recentCalls: string;
  readonly shout: string;
  readonly claimSent: string;
  readonly claimRejected: string;
  readonly waitingNewRound: string;
  readonly winningCard: string;
  /** A winner and the prize they won, as a phrase with no end mark, so each place adds its own: "Ana got the line". */
  readonly won: Record<Prize, (name: string) => string>;
  /** The same phrase on the winner's own phone: "You got the line". */
  readonly youWon: Record<Prize, string>;
  /** Said to everyone still playing once a prize is won and another is in play. */
  readonly keepGoing: Record<Prize, string>;

  readonly saidRoundStarted: (round: number) => string;
  readonly saidWon: (name: string, prize: Prize) => string;
  readonly saidYouWon: (prize: Prize) => string;
  readonly saidCard: (id: number, name: string, meaning: string) => string;
  readonly saidJoined: (names: readonly string[]) => string;
  readonly saidClaim: (name: string, valid: boolean) => string;
}

// The meanings follow the game's printed word list (Shimikuna), shortened to fit under a card.
const en: Strings = {
  languageName: 'English',
  cardMeanings: [
    'Hummingbird',
    'Cook',
    'Carrot',
    'Rainbow',
    'Honey bee',
    'Lagoon, lake',
    'Snake',
    'Moon',
    'Priest',
    'Sun',
    'Corn',
    'Andean cross',
    'Thumb',
    'House',
    'Bump',
    'Herb',
    'Stone',
    'Fish',
    'Door',
    'Drinking bowl',
    'Knot',
    'Cloud',
    'Chili pepper',
    'Toasted corn',
    'Yard, field',
    'Jungle, forest',
    'Mountain',
    'Bald',
    'Hair',
    'Cat',
    'Baby',
    'Bread',
    'Belly button',
    'Necklace',
    'Rain',
    'Flower',
    'Fire',
    'Hand',
    'Leg',
    'Porridge',
    'Beetle',
    'Chicken',
    'Celebration',
    'Seed',
    'Cold',
    'Star',
    'Pineapple',
    'Andean bird dancer',
    'Herbal tea',
    'Bone',
    'Kiss',
    'Thief',
    'Heart',
    'Guinea pig',
  ],
  rules: { 'line-then-full': 'Line, then full tabla', line: 'Line only', full: 'Full tabla only' },
  errors: {
    'game-over': 'This round is over.',
    'deck-empty': 'Every card has been called.',
    'unknown-player': 'You are not seated in this game.',
    'not-on-tabla': 'That card is not on your tabla.',
    'no-win': 'That tabla has not won: not every card it needs was called and marked.',
    'claim-pending': 'An ACHIK PUKLLAY claim is waiting for the Kawak.',
    'no-claim': 'That claim is no longer waiting.',
    'round-started': 'How to win can change only before the first card.',
    'bad-message': 'Something went wrong. Reload the page.',
    'room-not-found': 'No game has that code.',
    'session-expired': 'That game has ended.',
    'not-seated': 'Reconnecting to your game…',
    'not-host': 'Only the Kawak can do that.',
    'not-player': 'Only players can do that.',
  },
  title: (code) => (code ? `Room ${code} · Achik Pukllay` : 'Achik Pukllay'),
  reconnecting: 'Reconnecting…',
  connecting: 'Connecting…',
  connectionLost: 'Connection lost. Reconnecting…',

  tagline: 'Bingo in Kichwa. One Kawak calls the cards, everyone plays on their phone.',
  joinChoice: 'Join a game',
  joinChoiceHint: 'I have a room code',
  startChoice: 'Start a game',
  startChoiceHint: "I'll be the Kawak and call the cards",
  back: 'Back',
  joinHeading: 'Join a game',
  joinRoom: (code) => `Join room ${code}`,
  roomCode: 'Room code',
  roomCodeHint: (letters) => `${letters} letters`,
  yourName: 'Your name',
  join: 'Join',

  scanToJoin: 'Scan to join',
  invite: 'Invite',
  inviteText: (code) => `Join my Achik Pukllay game. Room code ${code}.`,
  linkCopied: 'Invite link copied.',
  copyFailed: 'Could not copy. Share the link under the room code.',
  endGame: 'End game',
  confirmEndGame: 'End this game? Nobody will be able to call cards in it again.',
  players: (count) => `Players (${count})`,
  noPlayers: 'Nobody yet. Share the code to invite players.',
  offline: ', offline',
  currentCard: 'Current card',
  ruleHeading: 'To win this round',
  firstCardPrompt: 'When everyone is in, press Next card.',
  callsSoFar: 'Calls so far',
  roundStatus: (round, rule, called) => `Round ${round} · ${rule} · ${called} called`,
  calledBefore: 'Called before, newest first',
  nextCard: 'Next card',
  newRound: 'New round',
  confirmNewRound: "Start a new round? Everyone gets a new tabla, and this round's tablas are cleared.",
  claimValid: { full: 'Valid: every card was called.', line: 'Valid: a full line was called.' },
  claimInvalid: { full: 'Not valid: not every card was called.', line: 'Not valid: no full line was called.' },
  wonBefore: (count) => `Already won ${count}`,
  moreClaims: (count) => `${count} more waiting`,
  notCalled: ', not called',
  grantWin: 'Grant win',
  notAWin: 'Not a win',

  room: 'Room',
  round: (round) => `Round ${round}`,
  leave: 'Leave',
  confirmLeave: 'Leave this game? You will not get this tabla back.',
  yourTabla: 'Your tabla',
  recentCalls: 'Latest calls, newest first',
  shout: 'ACHIK PUKLLAY!',
  claimSent: 'Sent to the Kawak…',
  claimRejected: "That one didn't count. Keep playing.",
  waitingNewRound: 'Waiting for the Kawak to start a new round.',
  winningCard: ', winning card',
  won: { line: (name) => `${name} got the line`, full: (name) => `${name} filled the tabla` },
  youWon: { line: 'You got the line', full: 'You filled the tabla' },
  keepGoing: { line: 'Keep going for a line.', full: 'Keep going for a full tabla.' },

  saidRoundStarted: (round) => `Round ${round}. New tablas dealt.`,
  saidWon: (name, prize) => `Achik Pukllay! ${en.won[prize](name)}.`,
  saidYouWon: (prize) => `Achik Pukllay! ${en.youWon[prize]}.`,
  saidCard: (id, name, meaning) => `Card ${id}, ${name}: ${meaning}.`,
  saidJoined: (names) => `${names.join(', ')} joined.`,
  saidClaim: (name, valid) => `${name} called Achik Pukllay! ${valid ? 'Valid.' : 'Not valid.'}`,
};

const es: Strings = {
  languageName: 'Español',
  cardMeanings: [
    'Colibrí',
    'Cocinero',
    'Zanahoria',
    'Arcoíris',
    'Abeja',
    'Laguna, lago',
    'Serpiente',
    'Luna',
    'Sacerdote',
    'Sol',
    'Maíz',
    'Cruz andina',
    'Pulgar',
    'Casa',
    'Chichón',
    'Hierba',
    'Piedra',
    'Pez',
    'Puerta',
    'Cuenco para beber',
    'Nudo',
    'Nube',
    'Ají',
    'Maíz tostado',
    'Cancha',
    'Selva, bosque',
    'Montaña',
    'Calvo',
    'Cabello',
    'Gato',
    'Bebé',
    'Pan',
    'Ombligo',
    'Collar',
    'Lluvia',
    'Flor',
    'Fuego',
    'Mano',
    'Pierna',
    'Colada',
    'Escarabajo',
    'Gallina',
    'Fiesta',
    'Semilla',
    'Frío',
    'Estrella',
    'Piña',
    'Curiquingue',
    'Agua de hierbas',
    'Hueso',
    'Beso',
    'Ladrón',
    'Corazón',
    'Cuy',
  ],
  rules: { 'line-then-full': 'Línea y luego tabla llena', line: 'Solo línea', full: 'Solo tabla llena' },
  errors: {
    'game-over': 'Esta ronda ya terminó.',
    'deck-empty': 'Ya se cantaron todas las cartas.',
    'unknown-player': 'No estás en este juego.',
    'not-on-tabla': 'Esa carta no está en tu tabla.',
    'no-win': 'Esa tabla no ganó: no todas las cartas que necesita fueron cantadas y marcadas.',
    'claim-pending': 'Hay un ACHIK PUKLLAY esperando al Kawak.',
    'no-claim': 'Ese ACHIK PUKLLAY ya no está esperando.',
    'round-started': 'Cómo ganar solo se puede cambiar antes de la primera carta.',
    'bad-message': 'Algo salió mal. Recarga la página.',
    'room-not-found': 'Ningún juego tiene ese código.',
    'session-expired': 'Ese juego ya terminó.',
    'not-seated': 'Reconectando a tu juego…',
    'not-host': 'Solo el Kawak puede hacer eso.',
    'not-player': 'Solo los jugadores pueden hacer eso.',
  },
  title: (code) => (code ? `Sala ${code} · Achik Pukllay` : 'Achik Pukllay'),
  reconnecting: 'Reconectando…',
  connecting: 'Conectando…',
  connectionLost: 'Se perdió la conexión. Reconectando…',

  tagline: 'Bingo en kichwa. Un Kawak canta las cartas, todos juegan desde su celular.',
  joinChoice: 'Unirse a un juego',
  joinChoiceHint: 'Tengo un código de sala',
  startChoice: 'Empezar un juego',
  startChoiceHint: 'Seré el Kawak y cantaré las cartas',
  back: 'Atrás',
  joinHeading: 'Unirse a un juego',
  joinRoom: (code) => `Unirse a la sala ${code}`,
  roomCode: 'Código de sala',
  roomCodeHint: (letters) => `${letters} letras`,
  yourName: 'Tu nombre',
  join: 'Unirse',

  scanToJoin: 'Escanea para unirte',
  invite: 'Invitar',
  inviteText: (code) => `Únete a mi juego de Achik Pukllay. Código de sala ${code}.`,
  linkCopied: 'Enlace copiado.',
  copyFailed: 'No se pudo copiar. Comparte el enlace debajo del código.',
  endGame: 'Terminar',
  confirmEndGame: '¿Terminar este juego? Nadie podrá volver a cantar cartas en él.',
  players: (count) => `Jugadores (${count})`,
  noPlayers: 'Nadie todavía. Comparte el código para invitar.',
  offline: ', desconectado',
  currentCard: 'Carta actual',
  ruleHeading: 'Para ganar esta ronda',
  firstCardPrompt: 'Cuando estén todos, toca Siguiente carta.',
  callsSoFar: 'Cartas cantadas',
  roundStatus: (round, rule, called) => `Ronda ${round} · ${rule} · ${called} cantadas`,
  calledBefore: 'Cantadas antes, la más reciente primero',
  nextCard: 'Siguiente carta',
  newRound: 'Nueva ronda',
  confirmNewRound: '¿Empezar una nueva ronda? Todos reciben una tabla nueva y se borran las de esta ronda.',
  claimValid: { full: 'Válido: todas las cartas fueron cantadas.', line: 'Válido: hay una línea completa cantada.' },
  claimInvalid: {
    full: 'No válido: no todas las cartas fueron cantadas.',
    line: 'No válido: no hay línea completa cantada.',
  },
  wonBefore: (count) => `Ya ganó ${count}`,
  moreClaims: (count) => `${count} más esperando`,
  notCalled: ', no cantada',
  grantWin: 'Dar la victoria',
  notAWin: 'No gana',

  room: 'Sala',
  round: (round) => `Ronda ${round}`,
  leave: 'Salir',
  confirmLeave: '¿Salir de este juego? No podrás recuperar esta tabla.',
  yourTabla: 'Tu tabla',
  recentCalls: 'Últimas cantadas, la más reciente primero',
  shout: 'ACHIK PUKLLAY!',
  claimSent: 'Enviado al Kawak…',
  claimRejected: 'Esa no contó. Sigue jugando.',
  waitingNewRound: 'Esperando a que el Kawak empiece otra ronda.',
  winningCard: ', carta ganadora',
  won: { line: (name) => `${name} hizo línea`, full: (name) => `${name} llenó la tabla` },
  youWon: { line: 'Hiciste línea', full: 'Llenaste la tabla' },
  keepGoing: { line: 'Sigan jugando por una línea.', full: 'Sigan jugando por la tabla llena.' },

  saidRoundStarted: (round) => `Ronda ${round}. Tablas nuevas.`,
  saidWon: (name, prize) => `Achik Pukllay. ${es.won[prize](name)}.`,
  saidYouWon: (prize) => `Achik Pukllay. ${es.youWon[prize]}.`,
  saidCard: (id, name, meaning) => `Carta ${id}, ${name}: ${meaning}.`,
  saidJoined: (names) => `${names.join(', ')} ${names.length === 1 ? 'se unió' : 'se unieron'}.`,
  // The Kawak canta the cards; a player grita the Kichwa shout, which takes no opening ¡.
  saidClaim: (name, valid) => `${name} gritó Achik Pukllay. ${valid ? 'Es válido.' : 'No es válido.'}`,
};

export const STRINGS: Record<Lang, Strings> = { en, es };

/** What card `id` means in `t`'s language. Ids come from the deck, so a missing meaning is a bug. */
export function cardMeaning(t: Strings, id: CardId): string {
  const meaning = t.cardMeanings[id - 1];
  if (meaning === undefined) throw new Error(`No meaning for card ${id}`);
  return meaning;
}

export const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

/**
 * The language to start in: a saved choice wins, then the first of the browser's preferred
 * languages that we have (by primary subtag, so `es-MX` counts as Spanish), then English.
 */
export function pickLang(saved: string | null, preferred: readonly string[]): Lang {
  if (isLang(saved)) return saved;
  for (const tag of preferred) {
    const primary = tag.split('-')[0]?.toLowerCase();
    if (isLang(primary)) return primary;
  }
  return 'en';
}

const KEY = 'loteria.lang.v1';

/** The saved choice, or null when there is none or storage is blocked (private windows, site data off). */
export function loadLang(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // Storage is blocked; the choice lasts as long as the page.
  }
}
