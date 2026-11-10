/**
 * Every word the page shows or speaks, in English and Spanish.
 *
 * Card names stay in Spanish in both languages: they are the deck's names, the ones a caller reads
 * aloud. Server errors arrive as codes, so their wording lives here too. A player's choice is kept
 * in localStorage; with none saved, the browser's preferred languages decide.
 */

import type { ErrorCode } from '@loteria/core';

export const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];

export interface Strings {
  /** This language's own name, shown on the switch that selects it. */
  readonly languageName: string;
  readonly errors: Record<ErrorCode, string>;
  readonly title: (code: string | null) => string;
  readonly reconnecting: string;
  readonly connecting: string;
  readonly connectionLost: string;

  readonly tagline: string;
  readonly joinHeading: string;
  readonly roomCode: string;
  readonly roomCodeHint: (letters: number) => string;
  readonly yourName: string;
  readonly join: string;
  readonly or: string;
  readonly hostHeading: string;
  readonly host: string;
  readonly hostHint: string;

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
  readonly firstCardPrompt: string;
  readonly callsSoFar: string;
  readonly roundStatus: (round: number, called: number, left: number) => string;
  readonly calledBefore: string;
  readonly nextCard: string;
  readonly newRound: string;
  readonly claimValid: string;
  readonly claimInvalid: string;
  readonly moreClaims: (count: number) => string;
  readonly notCalled: string;
  readonly grantWin: string;
  readonly notAWin: string;

  readonly room: string;
  readonly round: (round: number) => string;
  readonly leave: string;
  readonly confirmLeave: string;
  readonly yourTabla: string;
  readonly loteria: string;
  readonly claimSent: string;
  readonly claimRejected: string;
  readonly waitingNewRound: string;
  readonly winningLine: string;
  readonly youWin: string;
  readonly playerWins: (name: string) => string;

  readonly saidRoundStarted: (round: number) => string;
  readonly saidYouWin: string;
  readonly saidPlayerWins: (name: string) => string;
  readonly saidCard: (id: number, name: string) => string;
  readonly saidJoined: (names: readonly string[]) => string;
  readonly saidClaim: (name: string, valid: boolean) => string;
}

const en: Strings = {
  languageName: 'English',
  errors: {
    'game-over': 'This round is over.',
    'deck-empty': 'Every card has been called.',
    'unknown-player': 'You are not seated in this game.',
    'not-on-tabla': 'That card is not on your tabla.',
    'no-line': 'That tabla has no full line of called cards.',
    'claim-pending': 'A LOTERÍA call is waiting for the caller.',
    'no-claim': 'That LOTERÍA call is no longer waiting.',
    'bad-message': 'Something went wrong. Reload the page.',
    'room-not-found': 'No game has that code.',
    'session-expired': 'That game has ended.',
    'not-seated': 'Reconnecting to your game…',
    'not-host': 'Only the caller can do that.',
    'not-player': 'Only players can do that.',
  },
  title: (code) => (code ? `Room ${code} · Lotería` : 'Lotería'),
  reconnecting: 'Reconnecting…',
  connecting: 'Connecting…',
  connectionLost: 'Connection lost. Reconnecting…',

  tagline: 'One caller, everyone on their phones.',
  joinHeading: 'Join a game',
  roomCode: 'Room code',
  roomCodeHint: (letters) => `${letters} letters`,
  yourName: 'Your name',
  join: 'Join',
  or: 'or',
  hostHeading: 'Be the caller',
  host: 'Host a game',
  hostHint: 'Start a room, share its code, then read each card aloud.',

  invite: 'Invite',
  inviteText: (code) => `Join my Lotería game. Room code ${code}.`,
  linkCopied: 'Invite link copied.',
  copyFailed: 'Could not copy. Share the link under the room code.',
  endGame: 'End game',
  confirmEndGame: 'End this game? Nobody will be able to call cards in it again.',
  players: (count) => `Players (${count})`,
  noPlayers: 'Nobody yet. Share the code to invite players.',
  offline: ', offline',
  currentCard: 'Current card',
  firstCardPrompt: 'Invite everyone, then press Next card to call the first one.',
  callsSoFar: 'Calls so far',
  roundStatus: (round, called, left) => `Round ${round} · ${called} called · ${left} left`,
  calledBefore: 'Called before, newest first',
  nextCard: 'Next card',
  newRound: 'New round',
  claimValid: 'Valid: a full line was called.',
  claimInvalid: 'Not valid: no full line was called.',
  moreClaims: (count) => `${count} more waiting`,
  notCalled: ', not called',
  grantWin: 'Grant win',
  notAWin: 'Not a win',

  room: 'Room',
  round: (round) => `Round ${round}`,
  leave: 'Leave',
  confirmLeave: 'Leave this game? You will not get this tabla back.',
  yourTabla: 'Your tabla',
  loteria: '¡LOTERÍA!',
  claimSent: 'Sent to the caller…',
  claimRejected: "That one didn't count. Keep playing.",
  waitingNewRound: 'Waiting for the caller to start a new round.',
  winningLine: ', winning line',
  youWin: '¡LOTERÍA! You win!',
  playerWins: (name) => `¡LOTERÍA! ${name} wins`,

  saidRoundStarted: (round) => `Round ${round}. New tablas dealt.`,
  saidYouWin: 'Lotería! You win!',
  saidPlayerWins: (name) => `Lotería! ${name} wins.`,
  saidCard: (id, name) => `Card ${id}, ${name}.`,
  saidJoined: (names) => `${names.join(', ')} joined.`,
  saidClaim: (name, valid) => `${name} called Lotería! ${valid ? 'Valid.' : 'Not valid.'}`,
};

const es: Strings = {
  languageName: 'Español',
  errors: {
    'game-over': 'Esta ronda ya terminó.',
    'deck-empty': 'Ya se cantaron todas las cartas.',
    'unknown-player': 'No estás en este juego.',
    'not-on-tabla': 'Esa carta no está en tu tabla.',
    'no-line': 'Esa tabla no tiene una línea completa de cartas cantadas.',
    'claim-pending': 'Hay una lotería esperando al cantor.',
    'no-claim': 'Esa lotería ya no está esperando.',
    'bad-message': 'Algo salió mal. Recarga la página.',
    'room-not-found': 'Ningún juego tiene ese código.',
    'session-expired': 'Ese juego ya terminó.',
    'not-seated': 'Reconectando a tu juego…',
    'not-host': 'Solo el cantor puede hacer eso.',
    'not-player': 'Solo los jugadores pueden hacer eso.',
  },
  title: (code) => (code ? `Sala ${code} · Lotería` : 'Lotería'),
  reconnecting: 'Reconectando…',
  connecting: 'Conectando…',
  connectionLost: 'Se perdió la conexión. Reconectando…',

  tagline: 'Uno canta, todos juegan desde su celular.',
  joinHeading: 'Unirse a un juego',
  roomCode: 'Código de sala',
  roomCodeHint: (letters) => `${letters} letras`,
  yourName: 'Tu nombre',
  join: 'Unirse',
  or: 'o',
  hostHeading: 'Sé el cantor',
  host: 'Crear un juego',
  hostHint: 'Crea una sala, comparte el código y canta cada carta en voz alta.',

  invite: 'Invitar',
  inviteText: (code) => `Únete a mi juego de Lotería. Código de sala ${code}.`,
  linkCopied: 'Enlace copiado.',
  copyFailed: 'No se pudo copiar. Comparte el enlace debajo del código.',
  endGame: 'Terminar',
  confirmEndGame: '¿Terminar este juego? Nadie podrá volver a cantar cartas en él.',
  players: (count) => `Jugadores (${count})`,
  noPlayers: 'Nadie todavía. Comparte el código para invitar.',
  offline: ', desconectado',
  currentCard: 'Carta actual',
  firstCardPrompt: 'Invita a todos y luego toca Siguiente carta para cantar la primera.',
  callsSoFar: 'Cartas cantadas',
  roundStatus: (round, called, left) => `Ronda ${round} · ${called} cantadas · quedan ${left}`,
  calledBefore: 'Cantadas antes, la más reciente primero',
  nextCard: 'Siguiente carta',
  newRound: 'Nueva ronda',
  claimValid: 'Válida: hay una línea completa cantada.',
  claimInvalid: 'No válida: no hay línea completa cantada.',
  moreClaims: (count) => `${count} más esperando`,
  notCalled: ', no cantada',
  grantWin: 'Dar la victoria',
  notAWin: 'No es lotería',

  room: 'Sala',
  round: (round) => `Ronda ${round}`,
  leave: 'Salir',
  confirmLeave: '¿Salir de este juego? No podrás recuperar esta tabla.',
  yourTabla: 'Tu tabla',
  loteria: '¡LOTERÍA!',
  claimSent: 'Enviado al cantor…',
  claimRejected: 'Esa no contó. Sigue jugando.',
  waitingNewRound: 'Esperando a que el cantor empiece otra ronda.',
  winningLine: ', línea ganadora',
  youWin: '¡LOTERÍA! ¡Ganaste!',
  playerWins: (name) => `¡LOTERÍA! Ganó ${name}`,

  saidRoundStarted: (round) => `Ronda ${round}. Tablas nuevas.`,
  saidYouWin: '¡Lotería! ¡Ganaste!',
  saidPlayerWins: (name) => `¡Lotería! Ganó ${name}.`,
  saidCard: (id, name) => `Carta ${id}, ${name}.`,
  saidJoined: (names) => `${names.join(', ')} ${names.length === 1 ? 'se unió' : 'se unieron'}.`,
  // The caller canta the cards; a player grita ¡Lotería!
  saidClaim: (name, valid) => `${name} gritó ¡Lotería! ${valid ? 'Es válida.' : 'No es válida.'}`,
};

export const STRINGS: Record<Lang, Strings> = { en, es };

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
