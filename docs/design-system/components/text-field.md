# Text field

The two fields on the join form: room code and name. daisyUI `input input-lg w-full`, with its border in `edge` (`styles.css:216-218`).

## Anatomy

A `text-sm font-medium` `<label for>` above the field, `gap-1`, in a `flex flex-col` (`render.ts:496-508`).

## Fields

| Field     | Attributes                                                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Room code | `required`, `minlength` and `maxlength` from `ROOM_CODE_LENGTH`, `pattern="[A-Za-z]{4}"` with a `title` ("4 letters"), `autocomplete="off"`, `autocapitalize="characters"`, `spellcheck="false"`, `enterkeyhint="next"`, mono, spaced, upper case |
| Name      | `required`, `maxlength` from `NAME_MAX_LENGTH`, `autocomplete="nickname"`, `enterkeyhint="go"`                                                                                                                                                    |

## Rules

**Limits come from core.** The field's limits and the server's schema read the same constants, so the browser refuses what the server would.

- Don't: `maxlength="20"` written out.
- Check: review.

**The field keeps its value and caret across renders.** `main.ts` keeps the typed values in `form` (`main.ts:298-303`) and restores focus and selection after each render.

- Check: review.

**The phone's keyboard fits the field:** capitals for the code, Next then Go.

- Check: review.

**Values are escaped** back into `value="…"`.

- Check: review.
