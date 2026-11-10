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
  type CardId,
  type ClaimView,
  type HostView,
  type PlayerView,
} from '@loteria/core';
import { STRINGS, type Lang, type Strings } from './i18n.js';

export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const joinLink = (code: string): string => `${location.origin}/?join=${code}`;

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
  ghost: 'btn-ghost',
} as const;

/** How much room a button takes. The 44px minimum height and the focus ring are in styles.css. */
const BUTTON_SIZE = {
  /** The one main action at the bottom of a screen. A 20px bold label counts as large text. */
  action: 'btn-lg h-14 w-full text-xl font-bold',
  /** Full width inside a form or panel. */
  block: 'btn-lg w-full',
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
 * Width of each card face. A face is a width container, so its number, picture and name scale with
 * it. `lg` fills the slot it sits in: as wide as the slot, or as wide as a 3:4 card of the slot's
 * height, whichever is smaller.
 */
const FACE_WIDTH = {
  lg: 'w-[min(100cqw,75cqh)]',
  sm: 'w-12',
} as const;

/** A called card as a standalone face. The small size drops the name; it stays in the label. */
export function cardFace(id: CardId, size: keyof typeof FACE_WIDTH): string {
  const c = card(id);
  return `<div role="img" lang="es" aria-label="${c.id}, ${esc(c.name)}" class="relative flex aspect-[3/4] shrink-0 flex-col items-center justify-center gap-0.5 rounded-box border-2 border-edge bg-base-100 p-1 shadow [container-type:inline-size] ${FACE_WIDTH[size]}">
    <span class="absolute top-face-inset left-face-inset text-face-number leading-none font-bold" aria-hidden="true">${c.id}</span>
    <span class="text-face-picture leading-none" aria-hidden="true">${c.emoji}</span>
    ${size === 'sm' ? '' : `<span class="text-center text-face-name leading-tight font-semibold" aria-hidden="true">${esc(c.name)}</span>`}
  </div>`;
}

/** Earlier calls, newest first, in one row that scrolls sideways so it never pushes the page down. */
function calledRowHtml(ids: readonly CardId[], t: Strings): string {
  if (!ids.length) return '';
  return `<ol tabindex="0" aria-label="${t.calledBefore}" class="flex gap-1.5 overflow-x-auto rounded-box pb-1">
    ${ids.map((id) => `<li>${cardFace(id, 'sm')}</li>`).join('')}
  </ol>`;
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
  /** Cell indexes of a winning line, outlined. */
  readonly line?: Highlight<number>;
  /** Marked cards the caller never called, crossed out for the caller to see. */
  readonly notCalled?: Highlight<CardId>;
  /** Cells become buttons that toggle a bean. */
  readonly interactive?: boolean;
  /** The buttons are shown but cannot be pressed, while a claim is checked. */
  readonly locked?: boolean;
  /** Beans still rolling onto the card, with how many ms of their roll have already played. */
  readonly rolling?: ReadonlyMap<CardId, number>;
}

/**
 * A 4x4 tabla that fills its parent's height. On a player's own phone each cell is a toggle button
 * showing the card's name; elsewhere it is a compact picture, number and emoji, with the name in
 * its label so it fits beside everything else. Each cell is a width container: the picture scales
 * with the cell's width, and its height stays free so enlarged text makes the row taller instead of
 * clipping. The card number sits on its own backing above the bean, so wherever a bean lands the
 * caller can still read it to check a line.
 */
export function tablaHtml(tabla: readonly CardId[], opts: TablaOptions): string {
  const cells = tabla
    .map((id, cell) => {
      const c = card(id);
      const marked = opts.marked?.has(id) ?? false;
      const lineLabel = opts.line?.items.has(cell) ? opts.line.label : null;
      const notCalledLabel = opts.notCalled?.items.has(id) ? opts.notCalled.label : null;
      const inLine = lineLabel !== null;
      const notCalled = notCalledLabel !== null;
      const tag = opts.interactive ? 'button' : 'div';
      const attrs = opts.interactive
        ? `type="button" data-action="mark" data-card="${id}" aria-pressed="${marked}" aria-label="${esc(c.name)}" ${opts.locked ? 'disabled' : ''}`
        : `role="img" aria-label="${esc(c.name)}${lineLabel ?? ''}${notCalledLabel ?? ''}"`;
      return `<${tag} ${attrs} lang="es" class="relative flex min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-box border-2 bg-base-100 p-1 [container-type:inline-size] ${
        inLine
          ? 'border-success ring-4 ring-success/60'
          : notCalled
            ? 'crossed-out border-dashed border-base-content'
            : 'border-edge'
      } ${opts.interactive && !opts.locked ? 'cursor-pointer select-none motion-safe:active:scale-95' : ''}">
        <span class="absolute top-0.5 left-1 z-10 rounded-sm bg-base-100 px-0.5 text-[0.7rem] leading-none font-bold" aria-hidden="true">${c.id}</span>
        <span class="text-cell-picture leading-none" aria-hidden="true">${c.emoji}</span>
        ${opts.interactive ? `<span class="text-center text-cell-name leading-tight font-semibold [overflow-wrap:anywhere]" aria-hidden="true">${esc(c.name)}</span>` : ''}
        ${marked ? beanHtml(opts.round, id, opts.rolling?.get(id)) : ''}
      </${tag}>`;
    })
    .join('');
  // Rows never shrink below 3rem, so a tap target stays above 44px however short the phone.
  return `<div class="grid flex-1 gap-1.5" style="grid-template-columns: repeat(${TABLA_SIDE}, minmax(0, 1fr)); grid-template-rows: repeat(${TABLA_SIDE}, minmax(3rem, 1fr))">${cells}</div>`;
}

// ---- shared pieces ------------------------------------------------------------------------------

function seatsHtml(players: HostView['players'], t: Strings): string {
  if (!players.length) return `<p class="text-sm">${t.noPlayers}</p>`;
  return `<ul class="flex flex-wrap gap-1.5">${players
    .map(
      (p) => `<li class="badge gap-1.5 ${p.connected ? 'badge-outline' : 'badge-ghost'}">
        <span class="inline-block size-2 rounded-full ${p.connected ? 'bg-success' : 'bg-edge'}" aria-hidden="true"></span>${esc(p.name)}${p.connected ? '' : `<span class="sr-only">${t.offline}</span>`}</li>`,
    )
    .join('')}</ul>`;
}

/** The winner's tabla with the line outlined, so everyone can check it. Fills the flexible area. */
function winnerHtml(winner: NonNullable<HostView['winner']>, round: number, t: Strings, you?: string): string {
  const heading = winner.playerId === you ? t.youWin : t.playerWins(esc(winner.name));
  return `<section aria-labelledby="winner-heading" class="flex flex-1 flex-col gap-2">
    <h2 id="winner-heading" class="text-center text-2xl font-black">${heading}</h2>
    ${tablaHtml(winner.tabla, {
      round,
      line: { items: new Set(winner.line), label: t.winningLine },
      marked: new Set(winner.line.map((cell) => winner.tabla[cell]!)),
    })}
  </section>`;
}

/**
 * The first waiting LOTERÍA call, for the caller to check: the player's tabla and beans, the winning
 * line outlined when there is one, and every bean on a card that was never called crossed out.
 */
function claimHtml(
  claim: ClaimView,
  othersWaiting: number,
  called: ReadonlySet<CardId>,
  round: number,
  t: Strings,
): string {
  // Two short lines whatever the name or language, so the tabla keeps its room on short phones: a
  // long name is cut with an ellipsis rather than wrapping. The heading carries a label because its
  // two parts are separated only by a visual gap, which a screen reader would run together.
  return `<section aria-labelledby="claim-heading" class="flex flex-1 flex-col gap-2">
    <div>
      <div class="flex items-center justify-between gap-2">
        <h2 id="claim-heading" aria-label="${esc(claim.name)} ${t.loteria}" class="flex min-w-0 items-baseline gap-2 text-xl font-black">
          <span class="truncate">${esc(claim.name)}</span><span class="shrink-0">${t.loteria}</span>
        </h2>
        ${othersWaiting ? `<span class="badge badge-outline shrink-0">${t.moreClaims(othersWaiting)}</span>` : ''}
      </div>
      <p class="text-sm font-semibold">${claim.line ? t.claimValid : t.claimInvalid}</p>
    </div>
    ${tablaHtml(claim.tabla, {
      round,
      marked: new Set(claim.marked),
      notCalled: { items: new Set(claim.marked.filter((id) => !called.has(id))), label: t.notCalled },
      ...(claim.line ? { line: { items: new Set(claim.line), label: t.winningLine } } : {}),
    })}
  </section>`;
}

const offlineBanner = (online: boolean, t: Strings): string =>
  online ? '' : `<div class="alert alert-warning py-2 text-sm">${t.reconnecting}</div>`;

/** What the caller's screen reader should hear after a view arrives, or '' for nothing new. */
export function hostAnnouncement(prev: HostView | null, next: HostView, t: Strings): string {
  if (prev && prev.round !== next.round) return t.saidRoundStarted(next.round);
  if (next.winner && !prev?.winner) return t.saidPlayerWins(next.winner.name);
  const claim = next.claims.find((c) => !prev?.claims.some((p) => p.playerId === c.playerId));
  if (claim) return t.saidClaim(claim.name, claim.line !== null);
  const latest = next.called.at(-1);
  if (latest !== undefined && latest !== prev?.called.at(-1)) return t.saidCard(latest, card(latest).name);
  if (prev) {
    const joined = next.players.filter((p) => !prev.players.some((q) => q.id === p.id));
    if (joined.length) return t.saidJoined(joined.map((p) => p.name));
  }
  return '';
}

/**
 * What a player's screen reader should hear. Never a card: players hear those from the caller. A
 * claim is only acknowledged as sent; the verdict comes when the caller gives it.
 */
export function playerAnnouncement(prev: PlayerView | null, next: PlayerView, t: Strings): string {
  if (prev && prev.round !== next.round) return t.saidRoundStarted(next.round);
  if (next.winner && !prev?.winner) {
    return next.winner.playerId === next.you ? t.saidYouWin : t.saidPlayerWins(next.winner.name);
  }
  if (next.claim !== prev?.claim) {
    if (next.claim === 'pending') return t.claimSent;
    if (next.claim === 'rejected') return t.claimRejected;
  }
  return '';
}

// ---- screens ------------------------------------------------------------------------------------

export interface HomeForm {
  readonly code: string;
  readonly name: string;
}

export function homeHtml(form: HomeForm, online: boolean, lang: Lang): string {
  const t = STRINGS[lang];
  return `${offlineBanner(online, t)}
    <header>
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-4xl font-black tracking-tight">Lotería</h1>
        ${langSwitchHtml(lang)}
      </div>
      <p class="mt-1">${t.tagline}</p>
    </header>
    <form data-form="join" aria-labelledby="join-heading" class="card gap-3 border border-base-300 bg-base-100 p-4 shadow">
      <h2 id="join-heading" class="text-lg font-bold">${t.joinHeading}</h2>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="code">${t.roomCode}</label>
        <input id="code" name="code" required minlength="${ROOM_CODE_LENGTH}" maxlength="${ROOM_CODE_LENGTH}"
          pattern="[A-Za-z]{${ROOM_CODE_LENGTH}}" title="${t.roomCodeHint(ROOM_CODE_LENGTH)}"
          autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="next"
          class="input input-lg w-full font-mono tracking-[0.3em] uppercase" value="${esc(form.code)}" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="name">${t.yourName}</label>
        <input id="name" name="name" required maxlength="${NAME_MAX_LENGTH}" autocomplete="nickname" enterkeyhint="go"
          class="input input-lg w-full" value="${esc(form.name)}" />
      </div>
      ${buttonHtml(t.join, { variant: 'primary', size: 'block', disabled: !online })}
    </form>
    <div class="divider my-0">${t.or}</div>
    <section aria-labelledby="host-heading" class="flex flex-col gap-1">
      <h2 id="host-heading" class="sr-only">${t.hostHeading}</h2>
      ${buttonHtml(t.host, { variant: 'secondary', size: 'block', action: 'host', disabled: !online, attrs: 'aria-describedby="host-hint"' })}
      <p id="host-hint" class="text-center text-sm">${t.hostHint}</p>
    </section>`;
}

export function waitingHtml(online: boolean, lang: Lang): string {
  const t = STRINGS[lang];
  return `${offlineBanner(online, t)}<div class="flex flex-1 items-center justify-center">
    <span class="loading loading-dots loading-lg" aria-hidden="true"></span><span class="sr-only">${t.connecting}</span>
  </div>`;
}

/**
 * The caller's main action, at the bottom where a thumb reaches it. A waiting claim comes first and
 * holds the deck: the caller can grant it only when a line backs it, and can only turn it down
 * when none does.
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
    return claim.line
      ? buttonHtml(t.grantWin, { ...ruling, variant: 'primary', action: 'grant' })
      : buttonHtml(t.notAWin, { ...ruling, variant: 'neutral', action: 'reject' });
  }
  const roundOver = view.winner !== null || view.remaining === 0;
  return buttonHtml(roundOver ? t.newRound : t.nextCard, {
    variant: 'primary',
    size: 'action',
    action: roundOver ? 'new-round' : 'draw',
    disabled: !online,
  });
}

export function hostHtml(view: HostView, online: boolean, lang: Lang): string {
  const t = STRINGS[lang];
  const [current, ...earlier] = [...view.called].reverse();
  const [claim, ...queued] = view.claims;
  return `${offlineBanner(online, t)}
    <header class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h1 class="text-sm font-semibold">${t.roomCode}</h1>
        <p class="font-mono text-4xl leading-tight font-black tracking-[0.2em]">${roomCodeHtml(view.code)}</p>
        <p class="text-xs break-all">${esc(joinLink(view.code))}</p>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-1">
        ${buttonHtml(t.invite, { variant: 'neutral', size: 'regular', action: 'share' })}
        <div class="flex">
          ${langSwitchHtml(lang)}
          ${buttonHtml(t.endGame, { variant: 'ghost', size: 'compact', action: 'leave' })}
        </div>
      </div>
    </header>

    <section aria-labelledby="players-heading">
      <h2 id="players-heading" class="mb-1 text-xs font-semibold tracking-wide uppercase">${t.players(view.players.length)}</h2>
      ${seatsHtml(view.players, t)}
    </section>

    ${
      view.winner
        ? winnerHtml(view.winner, view.round, t)
        : claim
          ? claimHtml(claim, queued.length, new Set(view.called), view.round, t)
          : // A grid track gives the inner box a settled size; a flex item's grown size in this
            // min-height column does not, and container units inside it resolve to 0.
            `<section aria-label="${t.currentCard}" class="grid min-h-40 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
            <div class="flex items-center justify-center [container-type:size]">
              ${current ? cardFace(current, 'lg') : `<p class="px-6 text-center text-lg">${t.firstCardPrompt}</p>`}
            </div>
          </section>`
    }

    <section aria-label="${t.callsSoFar}" class="flex flex-col gap-1">
      <p class="text-sm">${t.roundStatus(view.round, view.called.length, view.remaining)}</p>
      ${
        // A tabla on screen, won or being checked, needs the room more than the history does.
        view.winner || claim ? '' : calledRowHtml(earlier, t)
      }
    </section>

    ${hostActionHtml(view, online, t)}`;
}

/** Where the LOTERÍA button goes: the button, or word that the call is with the caller. */
function playerActionHtml(view: PlayerView, online: boolean, t: Strings): string {
  if (view.claim === 'pending') {
    return `<p class="flex h-14 items-center justify-center rounded-box border-2 border-edge text-xl font-bold">${t.claimSent}</p>`;
  }
  return `${view.claim === 'rejected' ? `<p class="text-center font-semibold">${t.claimRejected}</p>` : ''}
    ${buttonHtml(t.loteria, { variant: 'error', size: 'action', action: 'loteria', disabled: !online })}`;
}

/** `rolling` holds the beans still rolling onto the card, with how far into their roll each is. */
export function playerHtml(
  view: PlayerView,
  online: boolean,
  lang: Lang,
  rolling: ReadonlyMap<CardId, number>,
): string {
  const t = STRINGS[lang];
  return `${offlineBanner(online, t)}
    <header class="flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-lg leading-tight font-bold">${esc(view.name)}</h1>
        <p class="text-sm">${t.room} <span class="font-mono font-bold">${roomCodeHtml(view.code)}</span> · ${t.round(view.round)}</p>
      </div>
      ${langSwitchHtml(lang)}
      ${buttonHtml(t.leave, { variant: 'ghost', size: 'compact', action: 'leave' })}
    </header>

    ${
      view.winner
        ? `${winnerHtml(view.winner, view.round, t, view.you)}
          <p class="py-3 text-center">${t.waitingNewRound}</p>`
        : `<section aria-label="${t.yourTabla}" class="flex flex-1 flex-col">
            ${tablaHtml(view.tabla, {
              round: view.round,
              marked: new Set(view.marked),
              interactive: true,
              locked: view.claim === 'pending',
              rolling,
            })}
          </section>
          ${playerActionHtml(view, online, t)}`
    }`;
}

export function noticeHtml(notice: string): string {
  return notice ? `<div class="alert alert-info shadow-lg">${esc(notice)}</div>` : '';
}
