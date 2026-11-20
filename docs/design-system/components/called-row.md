# Called row

Calls as thumbnails, newest first, in one row that scrolls sideways: the caller's earlier calls under the current card, and a player's latest calls above their tabla.

## Function

`calledRowHtml(ids, label, thumb)` (`packages/web/src/render.ts`): an `<ol id="called-row">`, `overflow-x-auto`, `gap-1.5`, with `thumb(id)` drawing each item: the card art at 8:11, its printed number and name as the art has them. Renders nothing when `ids` is empty.

| `thumb`           | Item                                                                      | Where                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callerThumbHtml` | A 48px (`w-12`) picture                                                   | `hostHtml`: every earlier call                                                                                                                                       |
| `playerThumbHtml` | A 44px-wide (`w-11`) button, 44px tall, around 32px (`w-8`) art, centered | `playerHtml`: the last five calls (`RECENT_CALLS`). The art is small so the shout stays on a 568px-tall screen with the prize banner up; the button is a full target |

## Showing a call large

On a player's phone a tap on a thumbnail shows that card large in the middle of the screen, with its meaning, over everything (`zoomedCardHtml`): a [card face](card-face.md) on a `base-100` panel, `h-[min(75svh,40rem)]`, over a `base-content/50` backdrop. It appears in place, with no motion.

It closes on a tap anywhere, the card itself included, or by itself after `ZOOM_MS` (3 s, `main.ts`). Tapping the thumbnail again lands on the open card, so it closes too. A tap over the tabla while it is open only closes it; no bean goes down. It stays open through a new call and closes at a new round. Only a card in the player's row can be shown (`main.ts` checks `data-card` against `view.recent`). The page keeps which card is shown (`zoomed`, `main.ts`); the server never hears of it.

## Keyboard and screen reader

The list has `tabindex="0"` so a keyboard can reach and scroll it, and an `id` so focus finds it again after a render. Its `aria-label` is "Called before, newest first" on the caller's screen and "Latest calls, newest first" on a player's. Each thumbnail, picture or button, has `aria-label` "number, name" and `lang="qu"`; its `<img>` has `alt=""`.

A player's thumbnail button is `aria-pressed="true"` while its card is shown large, and keeps focus (`data-action="zoom"` plus `data-card`): Enter shows the card and Enter again or Escape closes it. Showing it speaks the card with its meaning (`cardAnnouncement`). The large card is `aria-hidden`, since the pressed button and the announcement already say what it shows.

## Rules

**It never pushes the page down.** One row, scrolling sideways, however many cards are out.

- Don't: `flex-wrap`.
- Check: review.

**On the caller's screen it gives way to a tabla.** While a winner's tabla or a claim is on screen, the row is not rendered: the tabla needs the room more than the history does. On a player's phone it stays while a claim waits and goes once the round is over.

- Check: review; `render.test.ts`, "keeps the latest calls while a claim waits, and drops them once the round is over".

**On the caller's screen the current card is not in it.** `hostHtml` splits `[current, ...earlier]` from the reversed calls. A player's row starts with the current card, since nothing else on the phone shows it.

- Check: `render.test.ts`, "shows the earlier calls under the current card, newest first".
