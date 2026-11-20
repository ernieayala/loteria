# Screens

Five screens, one per `Screen` kind in `main.ts` (`main.ts:35-40`), each a function in `render.ts` that returns the contents of `#app`. Each follows the [column](../foundations/space-and-layout.md#the-column): fixed rows, one flexible area, the main action last.

## Getting in, in as few taps as possible

A first-time visitor has to say only one thing: are they joining, or starting. Everything after that is filled in for them where it can be.

| Arriving by                        | Lands on                     | Taps to a seat                                               |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| The Kawak's QR code or invite link | Join, asking only for a name | Type a name, Join. With a remembered name: Join, one tap     |
| The app with no link, to play      | Home                         | Join a game, type the code and a name, Join                  |
| The app with no link, to call      | Home                         | Start a game: one tap, and the room is open with its QR code |
| A remembered seat                  | Waiting, then the seat       | None                                                         |

## Home

`homeHtml(online, lang)` (`render.ts:492-507`).

| Row     | Contents                                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banner  | Reconnecting, while offline                                                                                                                                                                       |
| Header  | "Achik Pukllay" (`h1`, `lang="qu"`), the [language switch](../components/language-switch.md), the tagline                                                                                         |
| Choices | Two `choice` [buttons](../components/button.md), centered in the flexible area: Join a game, "I have a room code" (`primary`); Start a game, "I'll be the Kawak and call the cards" (`secondary`) |

Nothing else is on this screen: two clear ways in read faster than a form beside a button.

## Join

`joinHtml(form, online, lang)` (`render.ts`). `form.codeGiven` is set when the code came from a link (`/?join=ABCD`, which the QR code holds).

| Row       | Contents                                                                                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banner    | Reconnecting, while offline                                                                                                                                                                   |
| Header    | Back (`ghost`, `compact`, to Home), the title, the language switch, the tagline                                                                                                               |
| Join form | `card` panel: "Join room ABCD" and the name [field](../components/text-field.md) when the code is given; otherwise "Join a game" and the room code and name fields. Join (`primary`, `block`) |

The name last joined with is remembered (`loadName`, `session.ts`) and filled in. The first empty field takes focus, so the keyboard comes up ready; with every field filled nothing does, so Join stays in view. A link to a room that no longer exists shows the code field again, with the "No game has that code." notice.

## Waiting

`waitingHtml(online, lang)` (`render.ts:549-554`): loading dots centered in the column, "Connecting…" for screen readers. Shown between a seat being remembered and its first view arriving.

## Caller

`hostHtml(view, online, lang, origin)` (`render.ts:584-628`). `origin` is `location.origin`, passed in by `main.ts` for the lobby's QR code.

| Row           | Contents                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banner        | Reconnecting, while offline                                                                                                                                                                                                                                                                                               |
| Header        | One row: "Room code" (`h1`) over the [room code](../components/room-code.md); Invite, the language switch, End game, which wrap to a second row only where the phone is too narrow (320px). No join link: the lobby's QR code carries it, and Invite shares it at any time                                                |
| Players       | "Players (n)" and the [seat list](../components/seat-list.md), one row that scrolls sideways however many join                                                                                                                                                                                                            |
| Flexible area | One of: once the round is over, the last winner's [tabla](../components/tabla.md) with any earlier winner named; the first waiting claim's tabla with its verdict; the current [card face](../components/card-face.md) with its meaning, under the prize status once a prize is won; or, before the first card, the lobby |
| Calls         | The round status ("Round 2 · Line, then full tabla · 14 called"; never the cards left, since players can see this screen) and, with no tabla on screen, the [called row](../components/called-row.md)                                                                                                                     |
| Action        | Grant win or Not a win while a claim waits; New round once the round is over or the deck is out, which asks before dealing ([confirmations](feedback.md#confirmations)); Next card otherwise (`hostActionHtml`, `render.ts:561-581`)                                                                                      |

The lobby (`lobbyHtml`) shows, top to bottom: the join link as a QR code (`qrHtml`), black on white and as large as the room left allows, captioned "Scan to join"; the rule picker; and "When everyone is in, press Next card." Measured with no scroll: the QR code is 134px across at 320x568 with nobody in yet, 111px with eight players; 172px at 375x629 with eight.

The rule picker (`rulePickerHtml`) is a group headed "To win this round" with three toggle [buttons](../components/button.md): Line, then full tabla; Line only; Full tabla only. The chosen one is `primary` and `aria-pressed="true"`, the others `outline`. It shows only until the first card, because the rule cannot change after (`setRule` refuses with `round-started`). A new game starts on Line, then full tabla, the way the game is usually played; a new round keeps the last one.

Once a prize is won and another is in play, a status above the card names the winner and what is next: "Ana got the line. Keep going for a full tabla." in a `success` frame.

A waiting claim holds the deck: the caller rules before calling on. Grant win appears only when the claim wins the prize in play, and Not a win only when it does not. The verdict names the prize ("Not valid: not every card was called."). A player who has won before in this room carries a badge, "Already won 2": a repeat winner may win again, and the caller decides. More claims waiting show as a badge ("2 more waiting").

## Player

`playerHtml(view, online, lang, rolling, zoomed)` (`render.ts`).

| Row           | Contents                                                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Banner        | Reconnecting, while offline                                                                                                                                                                                                                                        |
| Header        | The player's name (`h1`), "Room ABCD · Round 2 · Line, then full tabla"; the language switch, Leave                                                                                                                                                                |
| Calls         | The last five calls, newest first, in a [called row](../components/called-row.md) of 32px thumbnails, each a 44px button that shows its card large for 3 seconds; none before the first call                                                                       |
| Flexible area | The player's own tabla (interactive), under the prize status once a prize is won ("You got the line. Keep going for a full tabla." on the winner's own phone); or, once the round is over, the last winner's tabla with any earlier winner named, and no calls row |
| Action        | ACHIK PUKLLAY! (`error`, `action`) (`playerActionHtml`); "Sent to the Kawak…" in its place while the claim waits; "That one didn't count. Keep playing." above it after a no. With the round over: "Waiting for the Kawak to start a new round."                   |

The cards are heard at the table. A player who missed one finds it in the calls row, and taps it to see it large with its meaning ([showing a call large](../components/called-row.md#showing-a-call-large)). The row holds the last five only: the player's view carries no more than `RECENT_CALLS` ([protocol](../../code-system/glossary.md#the-table-not-the-phone)), so keeping up still means listening. Each new call is spoken to a screen reader as it lands in the row.

Measured with no scroll, the prize status showing: 320x568, 375x568, 375x664, 412x780; tabla cards 44px wide at 568px tall. With the prize status and "That one didn't count" both up, a 568px-tall screen scrolls 36px and a 600px one 4px, until the next call clears the line.

## Rules

**One `h1` per screen, and sections are labelled.** Each `<section>` has `aria-labelledby` pointing at its heading, or `aria-label` when it has none on screen.

- Conforming: `<section aria-labelledby="players-heading">` (`render.ts:603`).
- Non-conforming: an unlabelled `<section>`, which a screen reader lists as nothing.
- Check: review.

**Screen functions compose components; they do not restyle them.**

- Check: review.

## Checking a screen

A change to a screen is checked by eye at phone sizes from 320x568 to 412x780: the turn fits with no scroll, nothing clips, every target is 44px or more. Claude in Chrome cannot use DevTools device mode, so load the app in an `<iframe>` of the size wanted, on a same-origin page such as `/api/health`. Check again at 200% text size, where the page may scroll but nothing may clip.
