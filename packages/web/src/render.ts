/**
 * HTML for every screen, as strings. Pure presentation: each function takes what it shows and the
 * language to show it in, and returns markup. Player names are typed by strangers, so every one
 * goes through {@link esc}. Class strings are complete literals so Tailwind's scanner finds them.
 *
 * Every screen is one phone-height column (see `#app` in index.html): fixed rows on top, one
 * flexible area in the middle that takes the space left, and the main action at the bottom where a
 * thumb reaches it. Flexible areas have minimum sizes, so zoomed text scrolls instead of clipping.
 *
 * Colors, the focus ring and the 44px button minimum live in styles.css; every button comes from
 * {@link buttonHtml}. Nothing here sets a color or a focus style of its own.
 */

import {
  card,
  DECK_SIZE,
  mulberry32,
  NAME_MAX_LENGTH,
  ROOM_CODE_LENGTH,
  TABLA_SIDE,
  WIN_RULES,
  type CardId,
  type ClaimView,
  type HostView,
  type PlayerView,
  type Prize,
  type WinnerView,
  type WinRule,
} from '@loteria/core';
import { renderSVG } from 'uqr';
import { cardArt } from './art.js';
import { cardMeaning, STRINGS, type Lang, type Strings } from './i18n.js';

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The link that seats a phone in a room. `origin` is the page's own, passed in so this file reads no globals. */
export const joinLink = (origin: string, code: string): string => `${origin}/?join=${code}`;

/** A room code as a screen reader should say it: letter by letter, not as a word. */
const spelled = (code: string): string => code.split('').join(' ');

const roomCodeHtml = (code: string): string =>
  `<span aria-hidden="true">${code}</span><span class="sr-only">${spelled(code)}</span>`;

// ---- controls ---------------------------------------------------------------------------------

const BUTTON_VARIANT = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  error: 'btn-error',
  neutral: 'btn-neutral',
  /** The choices not taken in a set of toggles, beside a `primary` one that is. */
  outline: 'btn-outline',
  ghost: 'btn-ghost',
} as const;

/** How much room a button takes. The 44px minimum height and the focus ring are in styles.css. */
const BUTTON_SIZE = {
  /** The one main action at the bottom of a screen. A 20px bold label counts as large text. */
  action: 'btn-lg h-14 w-full text-xl font-bold',
  /** A narrow button sharing the main action's row, before it: as tall, so the row stays one line. */
  side: 'h-14 w-20 shrink-0 px-2 leading-tight',
  /** Full width inside a form or panel. */
  block: 'btn-lg w-full',
  /** One of the home screen's two ways in: a large full-width card with a title and a line under it. */
  choice: 'h-auto min-h-24 w-full flex-col gap-1 py-4 text-2xl font-bold',
  regular: '',
  /** A small button in a header row. */
  compact: 'btn-sm shrink-0',
} as const;

interface ButtonOptions {
  readonly variant: keyof typeof BUTTON_VARIANT;
  readonly size: keyof typeof BUTTON_SIZE;
  /** The key main.ts dispatches clicks on. Without one the button submits its form. */
  readonly action?: string;
  readonly disabled?: boolean;
  /** Further attributes, already escaped. */
  readonly attrs?: string;
}

/** Every button on every screen. `label` is app copy, never player input. */
function buttonHtml(label: string, { variant, size, action, disabled = false, attrs = '' }: ButtonOptions): string {
  const type = action ? `type="button" data-action="${action}"` : 'type="submit"';
  return `<button ${type} ${attrs} class="btn ${BUTTON_VARIANT[variant]} ${BUTTON_SIZE[size]}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

/**
 * The switch to the other language, labelled in that language so a reader of it can find it. It
 * carries `lang` so a screen reader pronounces the label in its own language.
 */
function langSwitchHtml(lang: Lang): string {
  const other: Lang = lang === 'en' ? 'es' : 'en';
  return buttonHtml(STRINGS[other].languageName, {
    variant: 'ghost',
    size: 'compact',
    action: 'lang',
    attrs: `data-lang="${other}" lang="${other}"`,
  });
}

// ---- cards ------------------------------------------------------------------------------------

/**
 * The language tag on every card name. Unified Kichwa has no tag of its own; `qu`, the Quechua
 * macrolanguage, covers it, and tells a screen reader the name is not English or Spanish.
 */
const KICHWA = 'qu';

/**
 * How wide each place draws a card, as an `<img sizes>`, so the browser fetches the smallest art
 * that stays sharp. 28rem is the page's widest (`max-w-md` in index.html), and a tabla cell is a
 * quarter of it.
 */
const ART_SIZES = {
  current: '(min-width: 28rem) 28rem, 100vw',
  cell: '(min-width: 28rem) 7rem, 25vw',
  thumb: '3rem',
} as const;

/** A card's art. `attrs` gives its `alt` and class; the art never sets them itself. */
function artHtml(id: CardId, where: keyof typeof ART_SIZES, attrs: string): string {
  const { src, srcset } = cardArt(id);
  return `<img src="${src}" srcset="${srcset}" sizes="${ART_SIZES[where]}" draggable="false" ${attrs} />`;
}

/**
 * A card's number on its own backing, over the one printed on the art. The printed number is too
 * small to read in a tabla cell or a thumbnail, and a bean may land on it; this one stays legible
 * above both.
 */
const cardNumberHtml = (id: CardId): string =>
  `<span class="absolute top-0.5 left-1 z-10 rounded-sm bg-base-100 px-0.5 text-card-number leading-none font-bold" aria-hidden="true">${id}</span>`;

/**
 * The card the caller just drew, as large as the slot allows, with its meaning in the page's
 * language underneath for the caller to read out after the Kichwa name printed on the card.
 *
 * The figure is a size container, so it has no size of its own: it takes the slot the screen
 * leaves, and the art scales into it. Without that the art's own pixels set the slot's height and
 * push the main action off the screen.
 */
function currentCardHtml(id: CardId, t: Strings): string {
  return `<figure class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] justify-items-center gap-1 [container-type:size]">
    ${artHtml(id, 'current', `alt="${id}, ${esc(card(id).name)}" lang="${KICHWA}" class="size-full min-h-0 object-contain drop-shadow-md"`)}
    <figcaption class="text-center text-2xl font-bold">${esc(cardMeaning(t, id))}</figcaption>
  </figure>`;
}

/**
 * A {@link currentCardHtml} filling the screen's flexible area. A grid track gives the card a
 * settled height to scale into; a flex item's grown size in this min-height column does not.
 * `attrs` are further attributes, already escaped.
 */
function cardSectionHtml(id: CardId, label: string, t: Strings, attrs = ''): string {
  return `<section aria-label="${label}" ${attrs} class="grid min-h-40 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
    ${currentCardHtml(id, t)}
  </section>`;
}

/** Earlier calls, newest first, in one row that scrolls sideways so it never pushes the page down. */
function calledRowHtml(ids: readonly CardId[], t: Strings): string {
  if (!ids.length) return '';
  return `<ol tabindex="0" aria-label="${t.calledBefore}" class="flex gap-1.5 overflow-x-auto rounded-box pb-1">
    ${ids
      .map(
        (
          id,
        ) => `<li class="shrink-0"><div role="img" lang="${KICHWA}" aria-label="${id}, ${esc(card(id).name)}" class="relative w-12">
          ${cardNumberHtml(id)}
          ${artHtml(id, 'thumb', 'alt="" class="block aspect-[8/11] w-full"')}
        </div></li>`,
      )
      .join('')}
  </ol>`;
}

/**
 * The caller's choice of what this round awards. Each choice is a toggle: the chosen one is filled
 * and pressed, the others outlined.
 */
function rulePickerHtml(rule: WinRule, online: boolean, t: Strings): string {
  return `<div role="group" aria-labelledby="rule-heading" class="flex flex-col items-center gap-2">
    <h2 id="rule-heading" class="font-semibold">${t.ruleHeading}</h2>
    <div class="flex flex-wrap justify-center gap-2">
      ${WIN_RULES.map((r) =>
        buttonHtml(t.rules[r], {
          variant: r === rule ? 'primary' : 'outline',
          size: 'regular',
          action: 'rule',
          disabled: !online,
          attrs: `id="rule-${r}" data-rule="${r}" aria-pressed="${r === rule}"`,
        }),
      ).join('')}
    </div>
  </div>`;
}

/**
 * The join link as a QR code, for players at the table to scan instead of typing the code. Drawn
 * black on white, the contrast every phone camera reads; the white margin is the code's own quiet
 * zone. It is a size container, so the code takes the room it is given and stays square.
 */
function qrHtml(url: string, code: string, t: Strings): string {
  return `<figure class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] justify-items-center gap-1">
    <div class="grid size-full place-items-center [container-type:size]">
      <div role="img" aria-label="${t.scanToJoin}: ${spelled(code)}" class="size-[min(100cqw,100cqh)] bg-white text-black [&>svg]:size-full">
        ${renderSVG(url, { border: 2, whiteColor: 'transparent', blackColor: 'currentColor' })}
      </div>
    </div>
    <figcaption class="text-sm font-semibold">${t.scanToJoin}</figcaption>
  </figure>`;
}

/**
 * The caller's screen before the first card: the QR code to join, the rule for the round, and what
 * to do next. The QR code takes the room left; the rule and the prompt keep their own height.
 */
function lobbyHtml(view: HostView, online: boolean, origin: string, t: Strings): string {
  return `<div class="grid min-h-0 flex-1 grid-rows-[minmax(7rem,1fr)_auto_auto] gap-3 text-center">
    ${qrHtml(joinLink(origin, view.code), view.code, t)}
    ${rulePickerHtml(view.rule, online, t)}
    <p>${t.firstCardPrompt}</p>
  </div>`;
}

/** A set of cells or cards to single out, and the words a screen reader adds to each. */
interface Highlight<T> {
  readonly items: ReadonlySet<T>;
  readonly label: string;
}

/** How long a bean rolls, in ms. The CSS reads it as --roll-ms, so the two cannot disagree. */
export const BEAN_ROLL_MS = 1100;

/**
 * Where a bean lies on a card and how it rolls there, as the CSS custom properties `bean-spot` and
 * `bean-rolling` read (see styles.css), all in % of the card. It rests with its center somewhere in
 * the middle 60%, at a tilt. Its roll drops in at the top, strikes one side, bounces to the other
 * and rolls back across before settling; every waypoint stays on the card. Drawn from the round
 * and the card, not at random, so a bean stays put through every re-render and lies in the same
 * place on the caller's screen as on the player's phone.
 */
export function beanSpot(round: number, id: CardId): string {
  const rng = mulberry32(round * DECK_SIZE + id);
  const between = (low: number, high: number): number => low + rng() * (high - low);
  const leftFirst = rng() < 0.5;
  const sides = leftFirst ? [between(15, 35), between(65, 85)] : [between(65, 85), between(15, 35)];
  const spot = {
    x: between(20, 80),
    y: between(20, 80),
    x0: between(20, 80),
    x1: sides[0]!,
    y1: between(25, 60),
    x2: sides[1]!,
    y2: between(40, 85),
    x3: between(25, 75),
    y3: between(25, 75),
  };
  const turn = between(-35, 35);
  return `${Object.entries(spot)
    .map(([name, value]) => `--${name}:${value.toFixed(1)}%`)
    .join(';')};--turn:${turn.toFixed(0)}deg`;
}

/** A bean on its spot; `elapsed` is set while it is still rolling there. */
function beanHtml(round: number, id: CardId, elapsed: number | undefined): string {
  const roll = elapsed === undefined ? '' : `;--roll-ms:${BEAN_ROLL_MS}ms;--roll-elapsed:${Math.round(elapsed)}ms`;
  return `<span class="bean-spot ${elapsed === undefined ? '' : 'bean-rolling'}" style="${beanSpot(round, id)}${roll}" aria-hidden="true"><span class="bean"></span></span>`;
}

interface TablaOptions {
  /** The round the tabla belongs to; it places the beans. */
  readonly round: number;
  readonly marked?: ReadonlySet<CardId>;
  /** Cell indexes that won the tabla, outlined. */
  readonly winning?: Highlight<number>;
  /** Marked cards the caller never called, crossed out for the caller to see. */
  readonly notCalled?: Highlight<CardId>;
  /** Cells become buttons that toggle a bean. */
  readonly interactive?: boolean;
  /** The buttons are shown but cannot be pressed: while a claim is checked, or while offline. */
  readonly locked?: boolean;
  /** Beans still rolling onto the card, with how many ms of their roll have already played. */
  readonly rolling?: ReadonlyMap<CardId, number>;
}

/**
 * A 4x4 tabla that fills its parent's height. On a player's own phone each cell is a toggle button;
 * elsewhere it is a picture. Every cell shows the whole card, its printed name included, scaled to
 * fit the cell; the name is also the cell's label. Each cell is a width container, so the bean
 * scales with it. The card number sits on its own backing above the bean, so wherever a bean lands
 * the caller can still read it to check a tabla.
 */
function tablaHtml(tabla: readonly CardId[], opts: TablaOptions): string {
  const cells = tabla
    .map((id, cell) => {
      const name = esc(card(id).name);
      const marked = opts.marked?.has(id) ?? false;
      const winningLabel = opts.winning?.items.has(cell) ? opts.winning.label : null;
      const notCalledLabel = opts.notCalled?.items.has(id) ? opts.notCalled.label : null;
      const tag = opts.interactive ? 'button' : 'div';
      const attrs = opts.interactive
        ? `type="button" data-action="mark" data-card="${id}" aria-pressed="${marked}" aria-label="${name}" ${opts.locked ? 'disabled' : ''}`
        : `role="img" aria-label="${name}${winningLabel ?? ''}${notCalledLabel ?? ''}"`;
      return `<${tag} ${attrs} lang="${KICHWA}" class="relative min-w-0 overflow-hidden rounded-box border-2 bg-base-100 [container-type:inline-size] ${
        winningLabel !== null
          ? 'border-success ring-4 ring-success/60'
          : notCalledLabel !== null
            ? 'crossed-out border-dashed border-base-content'
            : 'border-edge'
      } ${opts.interactive && !opts.locked ? 'cursor-pointer select-none motion-safe:active:scale-95' : ''}">
        ${cardNumberHtml(id)}
        ${artHtml(id, 'cell', 'alt="" class="absolute inset-0 size-full object-contain p-0.5"')}
        ${marked ? beanHtml(opts.round, id, opts.rolling?.get(id)) : ''}
      </${tag}>`;
    })
    .join('');
  // Rows never shrink below 3rem, so a tap target stays above 44px however short the phone.
  return `<div class="grid flex-1 gap-1.5" style="grid-template-columns: repeat(${TABLA_SIDE}, minmax(0, 1fr)); grid-template-rows: repeat(${TABLA_SIDE}, minmax(3rem, 1fr))">${cells}</div>`;
}

// ---- shared pieces ------------------------------------------------------------------------------

/**
 * Every seat as a badge, in one row that scrolls sideways, so ten players take no more height than
 * one. It takes focus so a keyboard can scroll it, as the called row does.
 */
function seatsHtml(players: HostView['players'], t: Strings): string {
  if (!players.length) return `<p class="text-sm">${t.noPlayers}</p>`;
  return `<ul tabindex="0" aria-labelledby="players-heading" class="flex gap-1.5 overflow-x-auto pb-1">${players
    .map(
      (p) => `<li class="badge shrink-0 gap-1.5 whitespace-nowrap ${p.connected ? 'badge-outline' : 'badge-ghost'}">
        <span class="inline-block size-2 rounded-full ${p.connected ? 'bg-success' : 'bg-edge'}" aria-hidden="true"></span>${esc(p.name)}${p.connected ? '' : `<span class="sr-only">${t.offline}</span>`}</li>`,
    )
    .join('')}</ul>`;
}

/** A winner and their prize, as the reader should see it: "You got the line" on their own phone. */
const wonText = (winner: WinnerView, t: Strings, you?: string): string =>
  winner.playerId === you ? t.youWon[winner.prize] : t.won[winner.prize](esc(winner.name));

/**
 * The end of a round: the last prize's winner with their tabla and its winning cells outlined, so
 * everyone can check it, and any earlier prize's winner named above. Fills the flexible area.
 */
function roundOverHtml(winners: readonly WinnerView[], round: number, t: Strings, you?: string): string {
  const last = winners.at(-1);
  if (!last) throw new Error('A round is over only once a prize is won');
  const earlier = winners.slice(0, -1);
  return `<section aria-labelledby="winner-heading" class="flex flex-1 flex-col gap-2">
    <div class="text-center">
      <h2 id="winner-heading" class="text-xl font-black"><span lang="${KICHWA}">${t.shout}</span> ${wonText(last, t, you)}</h2>
      ${earlier.map((w) => `<p class="text-sm font-semibold">${wonText(w, t, you)}</p>`).join('')}
    </div>
    ${tablaHtml(last.tabla, {
      round,
      winning: { items: new Set(last.cells), label: t.winningCard },
      marked: new Set(last.cells.map((cell) => last.tabla[cell]!)),
    })}
  </section>`;
}

/**
 * Who has won so far while the round plays on for another prize, and what is in play now. Empty
 * until the first prize is won.
 */
function prizeStatusHtml(winners: readonly WinnerView[], prize: Prize, t: Strings, you?: string): string {
  if (!winners.length) return '';
  return `<p class="rounded-box border-2 border-success px-3 py-2 text-center font-semibold">
    ${winners.map((w) => wonText(w, t, you)).join(' · ')}. ${t.keepGoing[prize]}
  </p>`;
}

/**
 * The first waiting ACHIK PUKLLAY claim, for the caller to check: the player's tabla and beans, the
 * winning cells outlined when the claim wins the prize in play, and every bean on a card that was
 * never called crossed out. A player who has won before carries a badge with the count: whether a
 * repeat winner takes another prize is the caller's call.
 */
function claimHtml(
  claim: ClaimView,
  othersWaiting: number,
  called: ReadonlySet<CardId>,
  round: number,
  prize: Prize,
  t: Strings,
): string {
  // Two short lines whatever the name or language, so the tabla keeps its room on short phones: a
  // long name is cut with an ellipsis rather than wrapping. The heading carries a label because its
  // two parts are separated only by a visual gap, which a screen reader would run together.
  return `<section aria-labelledby="claim-heading" class="flex flex-1 flex-col gap-2">
    <div>
      <div class="flex items-center justify-between gap-2">
        <h2 id="claim-heading" aria-label="${esc(claim.name)} ${t.shout}" class="flex min-w-0 items-baseline gap-2 text-xl font-black">
          <span class="truncate">${esc(claim.name)}</span><span class="shrink-0">${t.shout}</span>
        </h2>
        ${othersWaiting ? `<span class="badge badge-outline shrink-0">${t.moreClaims(othersWaiting)}</span>` : ''}
      </div>
      <p class="flex flex-wrap items-center gap-2 text-sm font-semibold">
        ${claim.cells ? t.claimValid[prize] : t.claimInvalid[prize]}
        ${claim.wins ? `<span class="badge badge-neutral">${t.wonBefore(claim.wins)}</span>` : ''}
      </p>
    </div>
    ${tablaHtml(claim.tabla, {
      round,
      marked: new Set(claim.marked),
      notCalled: { items: new Set(claim.marked.filter((id) => !called.has(id))), label: t.notCalled },
      ...(claim.cells ? { winning: { items: new Set(claim.cells), label: t.winningCard } } : {}),
    })}
  </section>`;
}

const offlineBannerHtml = (online: boolean, t: Strings): string =>
  online ? '' : `<div class="alert alert-warning py-2 text-sm">${t.reconnecting}</div>`;

/** The prize granted since the last view of the same round, if one was. */
const newWinner = (prev: { winners: readonly WinnerView[] } | null, next: { winners: readonly WinnerView[] }) =>
  next.winners.length > (prev?.winners.length ?? 0) ? next.winners.at(-1) : undefined;

/** What the caller's screen reader should hear after a view arrives, or '' for nothing new. */
export function hostAnnouncement(prev: HostView | null, next: HostView, t: Strings): string {
  if (prev && prev.round !== next.round) return t.saidRoundStarted(next.round);
  const won = newWinner(prev, next);
  if (won) return t.saidWon(won.name, won.prize);
  const claim = next.claims.find((c) => !prev?.claims.some((p) => p.playerId === c.playerId));
  if (claim) return t.saidClaim(claim.name, claim.cells !== null);
  const latest = next.called.at(-1);
  if (latest !== undefined && latest !== prev?.called.at(-1)) {
    return t.saidCard(latest, card(latest).name, cardMeaning(t, latest));
  }
  if (prev) {
    const joined = next.players.filter((p) => !prev.players.some((q) => q.id === p.id));
    if (joined.length) return t.saidJoined(joined.map((p) => p.name));
  }
  return '';
}

/**
 * What a player's screen reader should hear. A card only while the Last card toggle shows it, as a
 * sighted player sees it change; otherwise players hear cards from the caller. A claim is only
 * acknowledged as sent; the verdict comes when the caller gives it.
 */
export function playerAnnouncement(prev: PlayerView | null, next: PlayerView, t: Strings, peeking: boolean): string {
  if (prev && prev.round !== next.round) return t.saidRoundStarted(next.round);
  const won = newWinner(prev, next);
  if (won) return won.playerId === next.you ? t.saidYouWon(won.prize) : t.saidWon(won.name, won.prize);
  if (next.claim !== prev?.claim) {
    if (next.claim === 'pending') return t.claimSent;
    if (next.claim === 'rejected') return t.claimRejected;
  }
  if (peeking && next.prize !== null && next.last !== null && next.last !== prev?.last) {
    return t.saidCard(next.last, card(next.last).name, cardMeaning(t, next.last));
  }
  return '';
}

// ---- screens ------------------------------------------------------------------------------------

/** The game's name and what it is, at the top of the screens before a game. */
function titleHtml(lang: Lang, t: Strings, start: string): string {
  return `<header>
      <div class="flex items-center justify-between gap-2">
        ${start}
        <h1 lang="${KICHWA}" class="min-w-0 flex-1 text-4xl font-black tracking-tight">Achik Pukllay</h1>
        ${langSwitchHtml(lang)}
      </div>
      <p class="mt-1">${t.tagline}</p>
    </header>`;
}

/**
 * The first screen: two ways in and nothing else, so a first-time visitor only has to say which
 * one they are. Joining opens the join form; starting creates the room at once.
 */
export function homeHtml(online: boolean, lang: Lang): string {
  const t = STRINGS[lang];
  const choice = (title: string, hint: string, variant: 'primary' | 'secondary', action: string): string =>
    buttonHtml(`<span>${title}</span><span class="text-base font-normal">${hint}</span>`, {
      variant,
      size: 'choice',
      action,
      disabled: !online,
    });
  return `${offlineBannerHtml(online, t)}
    ${titleHtml(lang, t, '')}
    <div class="flex flex-1 flex-col justify-center gap-4">
      ${choice(t.joinChoice, t.joinChoiceHint, 'primary', 'to-join')}
      ${choice(t.startChoice, t.startChoiceHint, 'secondary', 'host')}
    </div>`;
}

export interface JoinForm {
  readonly code: string;
  readonly name: string;
  /** The code came from an invite link or a QR code, so only the name is asked for. */
  readonly codeGiven: boolean;
}

/**
 * Joining a room. From an invite link the code is known, so the form asks only for a name, and a
 * remembered name makes it one tap. Back returns to the first screen.
 */
export function joinHtml(form: JoinForm, online: boolean, lang: Lang): string {
  const t = STRINGS[lang];
  const back = buttonHtml(t.back, { variant: 'ghost', size: 'compact', action: 'home' });
  return `${offlineBannerHtml(online, t)}
    ${titleHtml(lang, t, back)}
    <form aria-labelledby="join-heading" class="card gap-3 border border-base-300 bg-base-100 p-4 shadow">
      <h2 id="join-heading" class="text-lg font-bold">${
        form.codeGiven ? t.joinRoom(`<span class="font-mono">${roomCodeHtml(form.code)}</span>`) : t.joinHeading
      }</h2>
      ${
        form.codeGiven
          ? ''
          : `<div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="code">${t.roomCode}</label>
        <input id="code" name="code" required minlength="${ROOM_CODE_LENGTH}" maxlength="${ROOM_CODE_LENGTH}"
          pattern="[A-Za-z]{${ROOM_CODE_LENGTH}}" title="${t.roomCodeHint(ROOM_CODE_LENGTH)}"
          autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="next"
          class="input input-lg w-full font-mono tracking-[0.3em] uppercase" value="${esc(form.code)}" />
      </div>`
      }
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="name">${t.yourName}</label>
        <input id="name" name="name" required maxlength="${NAME_MAX_LENGTH}" autocomplete="nickname" enterkeyhint="go"
          class="input input-lg w-full" value="${esc(form.name)}" />
      </div>
      ${buttonHtml(t.join, { variant: 'primary', size: 'block', disabled: !online })}
    </form>`;
}

export function waitingHtml(online: boolean, lang: Lang): string {
  const t = STRINGS[lang];
  return `${offlineBannerHtml(online, t)}<div class="flex flex-1 items-center justify-center">
    <span class="loading loading-dots loading-lg" aria-hidden="true"></span><span class="sr-only">${t.connecting}</span>
  </div>`;
}

/**
 * The caller's main action, at the bottom where a thumb reaches it. A waiting claim comes first and
 * holds the deck: the caller can grant it only when it wins the prize in play, and can only turn it
 * down when it does not.
 */
function hostActionHtml(view: HostView, online: boolean, t: Strings): string {
  const claim = view.claims[0];
  if (claim) {
    // Described by the claim's heading, so a screen reader says whose call is being ruled on.
    const ruling = {
      size: 'action',
      disabled: !online,
      attrs: `data-player="${esc(claim.playerId)}" aria-describedby="claim-heading"`,
    } as const;
    return claim.cells
      ? buttonHtml(t.grantWin, { ...ruling, variant: 'primary', action: 'grant' })
      : buttonHtml(t.notAWin, { ...ruling, variant: 'neutral', action: 'reject' });
  }
  const roundOver = view.prize === null || view.remaining === 0;
  return buttonHtml(roundOver ? t.newRound : t.nextCard, {
    variant: 'primary',
    size: 'action',
    action: roundOver ? 'new-round' : 'draw',
    disabled: !online,
  });
}

/** `origin` is the page's own, for the join link shown under the room code. */
export function hostHtml(view: HostView, online: boolean, lang: Lang, origin: string): string {
  const t = STRINGS[lang];
  const [current, ...earlier] = [...view.called].reverse();
  const [claim, ...queued] = view.claims;
  // One row, so the card or tabla below keeps the height. The join link is not printed: the lobby's
  // QR code carries it, and Invite shares it at any time. The buttons wrap only on the narrowest phones.
  return `${offlineBannerHtml(online, t)}
    <header class="flex items-center justify-between gap-2">
      <div class="shrink-0">
        <h1 class="text-xs font-semibold">${t.roomCode}</h1>
        <p class="font-mono text-2xl leading-tight font-black tracking-[0.15em]">${roomCodeHtml(view.code)}</p>
      </div>
      <div class="flex min-w-0 flex-wrap items-center justify-end gap-1">
        ${buttonHtml(t.invite, { variant: 'neutral', size: 'compact', action: 'share' })}
        ${langSwitchHtml(lang)}
        ${buttonHtml(t.endGame, { variant: 'ghost', size: 'compact', action: 'leave' })}
      </div>
    </header>

    <section aria-labelledby="players-heading">
      <h2 id="players-heading" class="mb-1 text-xs font-semibold tracking-wide uppercase">${t.players(view.players.length)}</h2>
      ${seatsHtml(view.players, t)}
    </section>

    ${
      view.prize === null
        ? roundOverHtml(view.winners, view.round, t)
        : claim
          ? claimHtml(claim, queued.length, new Set(view.called), view.round, view.prize, t)
          : current
            ? `${prizeStatusHtml(view.winners, view.prize, t)}
            ${cardSectionHtml(current, t.currentCard, t)}`
            : lobbyHtml(view, online, origin, t)
    }

    <section aria-label="${t.callsSoFar}" class="flex flex-col gap-1">
      <p class="text-sm">${t.roundStatus(view.round, t.rules[view.rule], view.called.length, view.remaining)}</p>
      ${
        // A tabla on screen, won or being checked, needs the room more than the history does.
        view.prize === null || claim ? '' : calledRowHtml(earlier, t)
      }
    </section>

    ${hostActionHtml(view, online, t)}`;
}

/**
 * The bottom row of a round in play: the Last card toggle, then the ACHIK PUKLLAY button, or word
 * that the claim is with the caller, taking the rest of the row. The toggle sits here, not in the
 * header, so it costs the tabla no height and is where the thumb is.
 */
function playerActionHtml(view: PlayerView, online: boolean, shown: CardId | null, t: Strings): string {
  const lastCard = buttonHtml(t.lastCard, {
    variant: shown === null ? 'outline' : 'primary',
    size: 'side',
    action: 'peek',
    // Nothing to show before the first call. Offline it still shows the last call it was sent.
    disabled: view.last === null,
    // The id, not the action the card shares, is how focus finds the toggle after a render.
    attrs: `id="last-card" aria-pressed="${shown !== null}"`,
  });
  const shout =
    view.claim === 'pending'
      ? `<p class="flex h-14 items-center justify-center rounded-box border-2 border-edge text-center text-xl font-bold">${t.claimSent}</p>`
      : buttonHtml(t.shout, { variant: 'error', size: 'action', action: 'claim', disabled: !online });
  // daisyUI buttons do not shrink, so the shout's full width is the wrapper's, which takes what is left.
  return `${view.claim === 'rejected' ? `<p class="text-center font-semibold">${t.claimRejected}</p>` : ''}
    <div class="flex gap-2">${lastCard}<div class="min-w-0 flex-1">${shout}</div></div>`;
}

/**
 * `rolling` holds the beans still rolling onto the card, with how far into their roll each is.
 * `peeking` is the player's Last card toggle: while it is on and the round plays, the last call takes
 * the tabla's place, and a tap on it or on the toggle brings the tabla back. It follows each new
 * call. The page keeps the toggle; the server never hears of it.
 */
export function playerHtml(
  view: PlayerView,
  online: boolean,
  lang: Lang,
  rolling: ReadonlyMap<CardId, number>,
  peeking: boolean,
): string {
  const t = STRINGS[lang];
  const shown = peeking ? view.last : null;
  return `${offlineBannerHtml(online, t)}
    <header class="flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-lg leading-tight font-bold">${esc(view.name)}</h1>
        <p class="text-sm">${t.room} <span class="font-mono font-bold">${roomCodeHtml(view.code)}</span> · ${t.round(view.round)} · ${t.rules[view.rule]}</p>
      </div>
      ${langSwitchHtml(lang)}
      ${buttonHtml(t.leave, { variant: 'ghost', size: 'compact', action: 'leave' })}
    </header>

    ${
      view.prize === null
        ? `${roundOverHtml(view.winners, view.round, t, view.you)}
          <p class="py-3 text-center">${t.waitingNewRound}</p>`
        : `${prizeStatusHtml(view.winners, view.prize, t, view.you)}
          ${
            shown === null
              ? `<section aria-label="${t.yourTabla}" class="flex flex-1 flex-col">
            ${tablaHtml(view.tabla, {
              round: view.round,
              marked: new Set(view.marked),
              interactive: true,
              // Offline, a press could not reach the server, so the cells lock and the banner says why.
              locked: view.claim === 'pending' || !online,
              rolling,
            })}
          </section>`
              : // A tap anywhere on the card closes it, for a quick look; the toggle is the control a keyboard reaches.
                cardSectionHtml(shown, t.lastCard, t, 'data-action="peek"')
          }
          ${playerActionHtml(view, online, shown, t)}`
    }`;
}

export function noticeHtml(notice: string): string {
  return notice ? `<div class="alert alert-info shadow-lg">${esc(notice)}</div>` : '';
}
