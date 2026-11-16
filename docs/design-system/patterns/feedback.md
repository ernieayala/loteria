# Feedback

How the app tells a player or caller what happened. Five channels, each with one job.

| Channel             | Job                                                                                        | Where                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| The screen itself   | Every state a game can be in, drawn in place                                               | [screens](screens.md), [states](../foundations/states.md) |
| Notice (toast)      | A short message about something that did not show on screen: a refused move, a copied link | `flash` (`main.ts:151-157`) into `#notice`                |
| Reconnecting banner | The socket is down; the screen is stale and actions are paused                             | `offlineBannerHtml` (`render.ts:415-416`)                 |
| Announcement        | What a screen reader should hear after a view arrives                                      | `announce` (`main.ts:147-149`) into `#announcer`          |
| Confirmation        | Before an action that cannot be undone                                                     | `confirm()` (`main.ts:295`)                               |

## Notices

A server error arrives as a code and becomes its sentence from `STRINGS[lang].errors` (`main.ts:187-198`). `session-expired` also clears the seat and returns to home.

- Conforming: `'round-started'` becomes "How to win can change only before the first card."
- Non-conforming: showing the code, or a message written in `main.ts`.

Check: `tsc --build` (`errors` is a `Record<ErrorCode, string>`, so a code without a sentence fails to compile).

## Announcements

The live regions sit outside `#app` (`index.html:10-12`), so they persist across renders; a region rebuilt with its new text is often not read. `#announcer` is `role="status"`, polite; `#notice` is `role="alert"`.

| Seat   | Hears                                                                                                                                                                                             | Function                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Caller | A new round; a prize won ("Achik Pukllay! Ana got the line."); a new claim and whether it is valid; the latest card called, with its meaning; who joined. One per view, in that order of priority | `hostAnnouncement` (`render.ts:423-438`)   |
| Player | A new round; a prize won, by them or by another; "Sent to the Kawak…"; a claim turned down; a new call only while Last card shows it. Otherwise cards are heard from the caller                   | `playerAnnouncement` (`render.ts:445-457`) |
| Either | "Connection lost. Reconnecting…" when the socket drops in a game, not on Home or Join                                                                                                             | `main.ts:233`                              |

A view that changed nothing is not re-rendered or announced (`unchanged`, `main.ts:87-88`).

Rules:

- An announcement says what a sighted player sees change. It never says more: a player is not told the verdict on a claim before the caller rules, because the screen does not show it.
- Spoken text comes from `said…` strings, written to be heard ([voice](../content/voice.md#spoken-strings)).
- Check: review.

## Confirmations

Leave and End game forget the seat token, so the seat cannot be taken back. Both ask first with the browser's `confirm()` and a sentence saying what is lost (`confirmLeave`, `confirmEndGame`).

- Non-conforming: a destructive action that does not ask.

Check: review.
