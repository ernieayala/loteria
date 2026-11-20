# Voice

The app talks like someone at the table: short, plain, second person. English and Spanish say the same thing, each in its own way; neither is a word-for-word copy of the other. Spanish uses `tú` ("Únete", "Comparte", "Sigue jugando").

## Rules

### Sentence case

Labels, buttons, and headings capitalize the first word only, in both languages.

- Conforming: "Join a game", "Next card", "Código de sala".
- Non-conforming: "Join A Game", "Next Card".

Check: review.

### Labels and buttons have no period; sentences do

| Kind                                             | Ends with                  | Examples                                                        |
| ------------------------------------------------ | -------------------------- | --------------------------------------------------------------- |
| Button, label, heading, field tooltip            | Nothing                    | "Grant win", "Your name", "Players (3)", "4 letters"            |
| Hint, notice, verdict, confirmation, empty state | A period                   | "Every card has been called.", "Valid: a full line was called." |
| Something in progress                            | The ellipsis character `…` | "Reconnecting…", "Sent to the Kawak…"                           |
| The shout                                        | `!`                        | "ACHIK PUKLLAY!"                                                |

- Non-conforming: "Reconnecting..." (three periods), "Leave." on a button.

Check: review.

### A button says what happens

A verb ("Join", "Invite", "Leave", "Grant win"), the thing it brings ("Next card", "New round"), the ruling it gives ("Not a win"), the choice it makes ("Line only", "Join a game"), or the game's own word ("ACHIK PUKLLAY!"). A home-screen choice adds one line under it, in the first person, saying who it is for: "I have a room code", "I'll be the Kawak and call the cards".

- Non-conforming: "OK", "Submit", "Yes".

Check: review.

### The game's words

| Concept                    | English                                                  | Spanish                                                 | Rule                                                                                                    |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| The game                   | Achik Pukllay                                            | Achik Pukllay                                           | Two capitals, in the title and invite                                                                   |
| The shout                  | ACHIK PUKLLAY!                                           | ACHIK PUKLLAY!                                          | Upper case on screen: the button, the claim heading, a win. Kichwa, so no `¡` in either language        |
| A claim                    | an ACHIK PUKLLAY claim                                   | un ACHIK PUKLLAY                                        | "An ACHIK PUKLLAY claim is waiting for the Kawak." / "Hay un ACHIK PUKLLAY esperando al Kawak."         |
| The person who calls cards | the Kawak                                                | el Kawak                                                | The printed game's word for the caller. Starting a room is "Start a game"; "host" never appears in copy |
| What a round awards        | Line, then full tabla; Line only; Full tabla only        | Línea y luego tabla llena; Solo línea; Solo tabla llena | Sentence case; the toggles, the round status, and a player's header                                     |
| Winning a prize            | Ana got the line; Ana filled the tabla; You got the line | Ana hizo línea; Ana llenó la tabla; Hiciste línea       | A phrase with no end mark, so the heading, the status, and the spoken line each add their own           |
| A repeat winner            | Already won 2                                            | Ya ganó 2                                               | A badge on the claim, for the Kawak only                                                                |
| A player's board           | tabla                                                    | tabla                                                   | Not translated                                                                                          |
| A card's name              | Kinti                                                    | Kinti                                                   | Kichwa in both languages, as printed on the card                                                        |
| A card's meaning           | Hummingbird                                              | Colibrí                                                 | From the game's word list, a word or two                                                                |
| Calling a card             | called                                                   | cantada                                                 | "14 called", "Cartas cantadas"                                                                          |

Code calls the caller `host`; see the [glossary](../../code-system/glossary.md).

- Non-conforming: "the host" or "the caller" in copy; "Hummingbird" in place of Kinti as a card's name.

Check: review.

### A confirmation asks, then says what is lost

"Leave this game? You will not get this tabla back."

Check: review.

### Status lines join with a middle dot

`" · "` between parts: "Round 2 · Line only · 14 called", "Room ABCD · Round 2 · Line, then full tabla", and the page title "Room ABCD · Achik Pukllay".

Check: review.

### Counts avoid plural forms where they can

"Players (3)", "2 more waiting". Where a language needs a plural, its string function picks it: Spanish `saidJoined` says "se unió" or "se unieron".

Check: review.

### Screen-reader suffixes start with a comma

A string added to a label after the card name starts with ", ": ", offline", ", winning card", ", not called".

Check: review.

### Spoken strings

Strings for `#announcer` are named `said…` and written to be heard, not seen:

| Rule                                                                                  | Example                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| A whole sentence, with its period                                                     | "Card 16, Kiwa: Herb."                                 |
| "Achik Pukllay" in mixed case, so a voice says the words instead of spelling capitals | "Ana called Achik Pukllay! Valid."                     |
| No `¡` before the Kichwa shout; Spanish keeps it on its own words                     | "Achik Pukllay! You win!" / "Achik Pukllay! ¡Ganaste!" |
| A player's name raw: the announcer sets `textContent`, so it needs no escaping        | `saidWon(name, prize)`                                 |

Check: review.
