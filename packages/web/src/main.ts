/**
 * The page: one state value, one render, one click handler.
 *
 * The server owns the game. This file never decides whether a mark or a claim is legal; it sends
 * the move and draws whatever view comes back, and an error code becomes a short notice.
 */

import './styles.css';
import { ROOM_CODE_LENGTH, type CardId, type HostView, type PlayerView, type ServerMessage } from '@loteria/core';
import { isLang, loadLang, pickLang, saveLang, STRINGS, type Lang } from './i18n.js';
import {
  BEAN_ROLL_MS,
  homeHtml,
  hostAnnouncement,
  hostHtml,
  joinLink,
  noticeHtml,
  playerAnnouncement,
  playerHtml,
  waitingHtml,
  type HomeForm,
} from './render.js';
import { clearSeat, loadSeat, saveSeat } from './session.js';
import { openSocket } from './socket.js';

type Screen =
  | { readonly kind: 'home' }
  | { readonly kind: 'waiting' }
  | { readonly kind: 'host'; readonly view: HostView }
  | { readonly kind: 'player'; readonly view: PlayerView };

const NOTICE_MS = 2600;

const joinParam =
  new URLSearchParams(location.search).get('join')?.trim().toUpperCase().slice(0, ROOM_CODE_LENGTH) ?? '';
// A join link asks for a player seat in that room, so that is the only remembered seat it resumes.
// A caller who opens their own join link in a second tab gets a fresh join form, not a second caller
// screen; the caller's tab keeps its seat in its own sessionStorage and rewrites localStorage on its
// next reconnect.
const remembered = loadSeat();
if (joinParam && !(remembered?.role === 'player' && remembered.code === joinParam)) clearSeat();

let screen: Screen = loadSeat() ? { kind: 'waiting' } : { kind: 'home' };
let lang: Lang = pickLang(loadLang(), navigator.languages);
let online = false;
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
let form: HomeForm = { code: joinParam, name: '' };
/**
 * When each bean was put down, for beans that may still be rolling. Every render plays a roll from
 * how far it has got, so a render in the middle of a roll (another bean, a language switch) carries
 * it on instead of restarting it or cutting it short.
 */
const thrownAt = new Map<CardId, number>();

/** The beans still rolling, with the ms of their roll already played. Finished ones are forgotten. */
function rollingBeans(): ReadonlyMap<CardId, number> {
  const now = performance.now();
  const rolling = new Map<CardId, number>();
  for (const [id, at] of thrownAt) {
    if (now - at < BEAN_ROLL_MS) rolling.set(id, now - at);
    else thrownAt.delete(id);
  }
  return rolling;
}

/**
 * The server sends every seat a fresh view on every change in the room, and most changes do not
 * touch a given seat: a player's view is the same before and after the caller draws. Re-rendering
 * an unchanged view would only rebuild the page under the player's finger.
 */
const unchanged = (prev: unknown, next: unknown): boolean =>
  prev !== null && JSON.stringify(prev) === JSON.stringify(next);

const app = document.getElementById('app')!;
const announcer = document.getElementById('announcer')!;
const noticeBox = document.getElementById('notice')!;

/**
 * A selector that finds the same control after a render. Rendering replaces every element, so
 * without this a keyboard or screen-reader user is thrown back to the top of the page each time a
 * card is called.
 */
function focusSelector(el: Element | null): string | null {
  if (!(el instanceof HTMLElement) || !app.contains(el)) return null;
  if (el.id) return `#${el.id}`;
  const { action, card } = el.dataset;
  if (!action) return null;
  return `[data-action="${action}"]${card ? `[data-card="${card}"]` : ''}`;
}

function render(): void {
  const focused = document.activeElement;
  const selector = focusSelector(focused);
  const selection =
    focused instanceof HTMLInputElement ? ([focused.selectionStart, focused.selectionEnd] as const) : null;

  app.innerHTML =
    screen.kind === 'home'
      ? homeHtml(form, online, lang)
      : screen.kind === 'waiting'
        ? waitingHtml(online, lang)
        : screen.kind === 'host'
          ? hostHtml(screen.view, online, lang)
          : playerHtml(screen.view, online, lang, rollingBeans());
  // The page language tells screen readers which voice to read with.
  document.documentElement.lang = lang;
  document.title = STRINGS[lang].title(screen.kind === 'host' || screen.kind === 'player' ? screen.view.code : null);

  const restored = selector ? app.querySelector<HTMLElement>(selector) : null;
  restored?.focus();
  if (selection && restored instanceof HTMLInputElement) restored.setSelectionRange(selection[0], selection[1]);
}

function announce(text: string): void {
  if (text) announcer.textContent = text;
}

function flash(message: string): void {
  noticeBox.innerHTML = noticeHtml(message);
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    noticeBox.innerHTML = '';
  }, NOTICE_MS);
}

function onMessage(message: ServerMessage): void {
  switch (message.t) {
    case 'seat':
      saveSeat(message);
      if (screen.kind === 'home') screen = { kind: 'waiting' };
      break;
    case 'host-view': {
      const prev = screen.kind === 'host' ? screen.view : null;
      if (unchanged(prev, message.view)) return;
      screen = { kind: 'host', view: message.view };
      announce(hostAnnouncement(prev, message.view, STRINGS[lang]));
      break;
    }
    case 'player-view': {
      const prev = screen.kind === 'player' ? screen.view : null;
      if (unchanged(prev, message.view)) return;
      if (prev) {
        const now = performance.now();
        for (const id of message.view.marked) if (!prev.marked.includes(id)) thrownAt.set(id, now);
      } else {
        // The first view after joining or reconnecting: its beans were already down.
        thrownAt.clear();
      }
      screen = { kind: 'player', view: message.view };
      announce(playerAnnouncement(prev, message.view, STRINGS[lang]));
      break;
    }
    case 'error':
      if (message.code === 'session-expired') {
        clearSeat();
        screen = { kind: 'home' };
        render();
      }
      return flash(STRINGS[lang].errors[message.code]);
  }
  render();
}

/** Offer the join link through the phone's share sheet, or copy it where there is none. */
async function invite(code: string): Promise<void> {
  const url = joinLink(code);
  const t = STRINGS[lang];
  if ('share' in navigator) {
    try {
      await navigator.share({ title: 'Lotería', text: t.inviteText(code), url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    flash(t.linkCopied);
  } catch {
    // Clipboard access needs HTTPS or localhost; on a LAN address the link on screen is the way.
    flash(t.copyFailed);
  }
}

const socket = openSocket({
  onOpen() {
    online = true;
    const seat = loadSeat();
    if (seat) socket.send({ t: 'resume', code: seat.code, token: seat.token });
    render();
  },
  onClose() {
    // Leaving a game also drops the socket, but from the home screen there is nothing to lose.
    if (online && screen.kind !== 'home') announce(STRINGS[lang].connectionLost);
    online = false;
    render();
  },
  onMessage,
});

app.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  switch (target.dataset.action) {
    case 'host':
      socket.send({ t: 'host' });
      break;
    case 'lang':
      if (!isLang(target.dataset.lang)) return;
      lang = target.dataset.lang;
      saveLang(lang);
      render();
      break;
    case 'share':
      if (screen.kind === 'host') void invite(screen.view.code);
      break;
    case 'draw':
      socket.send({ t: 'draw' });
      break;
    case 'new-round':
      socket.send({ t: 'new-round' });
      break;
    case 'loteria':
      socket.send({ t: 'loteria' });
      break;
    case 'mark':
      socket.send({ t: 'mark', card: Number(target.dataset.card) });
      break;
    case 'grant':
      if (target.dataset.player) socket.send({ t: 'grant', player: target.dataset.player });
      break;
    case 'reject':
      if (target.dataset.player) socket.send({ t: 'reject', player: target.dataset.player });
      break;
    case 'leave': {
      // Leaving forgets the seat token, so the seat cannot be taken back.
      const what = screen.kind === 'host' ? STRINGS[lang].confirmEndGame : STRINGS[lang].confirmLeave;
      if (!confirm(what)) return;
      clearSeat();
      screen = { kind: 'home' };
      socket.restart();
      render();
      break;
    }
  }
});

app.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.name === 'code') form = { ...form, code: input.value.toUpperCase() };
  if (input.name === 'name') form = { ...form, name: input.value };
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  socket.send({ t: 'join', code: form.code, name: form.name });
});

render();
