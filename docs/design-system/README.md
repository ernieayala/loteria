# Achik Pukllay design system

The rules for everything a player or the Kawak (the caller) sees: the home form, the caller's screen, a player's tabla, and the words a screen reader speaks. The code rules live in [`docs/code-system/`](../code-system/README.md).

Each page states a rule, shows one conforming and one non-conforming example, names the tokens and functions involved, and names the check that enforces it. "Check: review" means no tool checks the rule and a reviewer must.

## Principles

| Principle                        | What it means on screen                                                                                                                                                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The printed game, on a phone     | The game's own card art, whole and unaltered, on warm paper and brown ink (daisyUI `retro`); beans that look like frijoles. Card names stay in Kichwa in both languages, with their meaning beside them for the Kawak                                                               |
| One phone, no scroll             | Every screen is one column the height of the small viewport. A turn never needs a scroll from 320x568 up; zoomed text grows the page instead of clipping                                                                                                                            |
| The thumb's action at the bottom | The caller's and the player's screens end in one main action where a thumb reaches it: Next card or New round, Grant win or Not a win, ACHIK PUKLLAY!                                                                                                                               |
| Played at a table                | The Kawak reads cards aloud. A player's phone holds the tabla, the round's rule, the ACHIK PUKLLAY button, and the last five calls as small thumbnails for a missed call; never the round's whole history                                                                           |
| No state rests on color alone    | A word, a shape, a border style, or an ARIA state carries each state; color repeats it. A winning card has a thick ring; a card never called is crossed out; a marked cell is `aria-pressed` and has a bean on it; the chosen rule is filled and `aria-pressed`, the other outlined |
| Readable and reachable           | Every text pair meets WCAG 2.2 AA, every target is 44px or more, every control keeps focus across renders, and every change a sighted player sees is spoken to a screen reader                                                                                                      |

## Tiers

| Tier        | Pages                                                                                   | Lives in                                                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations | `foundations/`: color, typography, space and layout, frames, imagery, motion, states    | The daisyUI `retro` theme and the `@theme` block in `packages/web/src/styles.css`                                                                       |
| Components  | `components/<name>.md`, one per piece of markup two screens share or one screen repeats | One function in `packages/web/src/render.ts`, plus a `@utility` in `styles.css` where Tailwind has no class for the look                                |
| Patterns    | `patterns/`: screens, feedback                                                          | The screen functions in `render.ts` (`homeHtml`, `joinHtml`, `waitingHtml`, `hostHtml`, `playerHtml`) and the live regions in `packages/web/index.html` |
| Content     | `content/`: voice, localization                                                         | `packages/web/src/i18n.ts`                                                                                                                              |

Tokens come in two layers:

| Layer | Named                                                                  | Read by                                                                         | Example                                                   |
| ----- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Theme | daisyUI's role names                                                   | Components, through daisyUI and Tailwind classes (`bg-base-100`, `btn-primary`) | `--color-base-content`, `--color-success`, `--radius-box` |
| App   | A Tailwind namespace (`--color-`, `--text-`, `--spacing-`) and the job | Components, through the utility class the namespace generates (`border-edge`)   | `--color-edge`, `--spacing-bean`                          |

App tokens sit in the `@theme` block (`styles.css:32-37`) so Tailwind makes a class for each. A value no token holds is written as a Tailwind scale class (`gap-1.5`, `text-sm`), never as a raw value in markup.

Check: review. Tailwind does not fail the build on an unknown class; it generates nothing for it. See the class-literal rule in [markup and styles](../code-system/markup-and-styles.md).

## Pages

| Page                                                                                     | Covers                                                                                            |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [foundations/color.md](foundations/color.md)                                             | The theme roles, the two overrides, the edge token, every text and surface pair with its contrast |
| [foundations/typography.md](foundations/typography.md)                                   | The font stacks, the type ramp, case and wrapping                                                 |
| [foundations/space-and-layout.md](foundations/space-and-layout.md)                       | The phone column, safe areas, the space steps, target sizes, container queries                    |
| [foundations/frames.md](foundations/frames.md)                                           | Borders, radius, rings, shadows                                                                   |
| [foundations/imagery.md](foundations/imagery.md)                                         | The card art and how it ships, the bean, decorative marks                                         |
| [foundations/motion.md](foundations/motion.md)                                           | The bean roll, the press, reduced motion                                                          |
| [foundations/states.md](foundations/states.md)                                           | One look per state: focus, pressed, disabled, locked, offline, winning card, not called           |
| `components/<name>.md`                                                                   | One page per component in the inventory below                                                     |
| [patterns/screens.md](patterns/screens.md)                                               | The column anatomy and each of the four screens                                                   |
| [patterns/feedback.md](patterns/feedback.md)                                             | Notices, the offline banner, spoken announcements, confirmations                                  |
| [content/voice.md](content/voice.md), [content/localization.md](content/localization.md) | UI copy in both languages and the structure of `i18n.ts`                                          |

Component inventory: [button](components/button.md), [language switch](components/language-switch.md), [card face](components/card-face.md), [called row](components/called-row.md), [tabla](components/tabla.md), [bean](components/bean.md), [seat list](components/seat-list.md), [room code](components/room-code.md), [text field](components/text-field.md), [alert](components/alert.md).

## Adding a component

Add one only when no component in the inventory covers the need. Markup used in two places is a component.

| Step | Do                                                                                                                                                                                                                                            | Check                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1    | Write the markup once, as a function in `render.ts` named `<name>Html` that takes what it shows and returns a string                                                                                                                          | review                                                                          |
| 2    | Build its look from daisyUI components and Tailwind classes. Variants and sizes are a `const` map of complete strings, keyed by name, as `BUTTON_VARIANT` and `ART_SIZES` are                                                                 | review (Tailwind finds only complete literals)                                  |
| 3    | Read theme and app tokens through their classes. A value no class holds becomes a token in `@theme`; a look no class can draw becomes a `@utility` in `styles.css` with a comment saying why                                                  | review                                                                          |
| 4    | Escape every value a player typed with `esc`                                                                                                                                                                                                  | `render.ts` review; no automated check                                          |
| 5    | Meet the accessibility contract: an accessible name on every control, a 44px target, a focus that survives a render (`data-action`, or an `id`), long text that wraps or truncates, no state on color alone, `lang="qu"` on Kichwa card names | review; the phone-size pass in [screens](patterns/screens.md#checking-a-screen) |
| 6    | Add every word to both languages in `i18n.ts`                                                                                                                                                                                                 | `tsc --build` (the `Strings` interface makes a missing string a type error)     |
| 7    | Write `components/<name>.md`: purpose, anatomy, variants, states, the function and its parameters, tokens, keyboard and screen-reader contract, long-text behavior, do and don't                                                              | review                                                                          |

Example, conforming: every button on every screen comes from `buttonHtml` (`render.ts:84-87`), so the 44px minimum, the focus ring and the variant colors are set once.

Example, non-conforming: the "Sent to the Kawak…" box (`render.ts:647`) draws its own `h-14 rounded-box border-2 border-edge` frame instead of reading a shared one. It is the only place that frame appears, so it is not yet a component; a second use makes it one.
