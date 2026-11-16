# Button

Every button on every screen: daisyUI's `btn`, built by one function so the target size, focus ring, and variant colors are set once.

## Function

`buttonHtml(label, { variant, size, action?, disabled?, attrs? })` (`packages/web/src/render.ts:84-87`).

| Parameter  | Meaning                                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`    | App copy from `STRINGS`, never player input. Not escaped                                                                                      |
| `variant`  | A key of `BUTTON_VARIANT` (`render.ts:48-56`)                                                                                                 |
| `size`     | A key of `BUTTON_SIZE` (`render.ts:59-71`)                                                                                                    |
| `action`   | The `data-action` key `main.ts` dispatches clicks on; renders `type="button"`. Without one the button is `type="submit"` and submits its form |
| `disabled` | Renders `disabled`                                                                                                                            |
| `attrs`    | Further attributes, already escaped: `id`, `data-*`, `lang`, `aria-describedby`, `aria-pressed`                                               |

## Variants

| Variant     | Class           | Use                                                                                                  |
| ----------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `primary`   | `btn-primary`   | The main way forward: Join, Next card, New round, Grant win; the chosen rule toggle; Last card on    |
| `secondary` | `btn-secondary` | The other way in: Start a game                                                                       |
| `neutral`   | `btn-neutral`   | A side action or a no: Invite, Not a win                                                             |
| `outline`   | `btn-outline`   | A toggle that is off: the rules not taken, beside the `primary` one that is; Last card off           |
| `error`     | `btn-error`     | ACHIK PUKLLAY!, at `action` size only ([color](../foundations/color.md#every-pair-meets-wcag-22-aa)) |
| `ghost`     | `btn-ghost`     | A quiet header control: the language switch, Back, Leave, End game                                   |

## Sizes

| Size      | Classes                                                         | Use                                                                                                            |
| --------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `action`  | `btn-lg h-14 w-full text-xl font-bold`                          | The one main action at the bottom of a screen. Its 20px bold label is large text                               |
| `side`    | `h-14 w-20 shrink-0 px-2 leading-tight`                         | Last card, before the shout in its row: as tall, narrow enough that the shout still fits at 320px              |
| `block`   | `btn-lg w-full`                                                 | Full width inside a form or panel                                                                              |
| `choice`  | `h-auto min-h-24 w-full flex-col gap-1 py-4 text-2xl font-bold` | The home screen's two ways in. The label is a title and a `text-base font-normal` line under it, both app copy |
| `regular` | none                                                            | The rule toggles                                                                                               |
| `compact` | `btn-sm shrink-0`                                               | A small header button, Invite included; still 44px tall (`styles.css:211-213`)                                 |

## States

Focus, disabled: [states](../foundations/states.md). daisyUI darkens a button 5% while pressed.

## Keyboard and screen reader

A native `<button>`: Tab reaches it, Enter and Space press it. The visible label is the name. A button that acts on something the label does not name points at it with `aria-describedby`: Grant win and Not a win are described by the claim heading, so a screen reader says whose call is being ruled on (`render.ts:564-569`).

## Long text

Labels wrap between words; daisyUI buttons grow in height.

## Rules

**Every button comes from `buttonHtml`.**

- Do: `buttonHtml(t.invite, { variant: 'neutral', size: 'compact', action: 'share' })` (`render.ts:597`).
- Don't: `<button class="btn btn-primary">` in a screen function.
- Check: review.

**At most one `action`-size button per screen, and it is last.** One `side` button may share its row, before it.

- Do: `hostActionHtml` returns exactly one (`render.ts:561-581`); `playerActionHtml` puts Last card before the shout.
- Don't: Grant win and Not a win side by side at `action` size. Only the one the claim allows is shown.
- Check: review.

**A label is a verb phrase or the game's own word.** See [voice](../content/voice.md).

- Check: review.
