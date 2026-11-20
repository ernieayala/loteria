# Markup and styles

The page is HTML strings from `render.ts`, set as `#app`'s `innerHTML` by one `render()` in `main.ts`. There is no framework and no DOM building in screen code.

## Rules

### Render functions are pure

A function in `render.ts` takes what it shows and the language, and returns a string. It reads no global state and touches no DOM; `main.ts` holds the state and calls it.

- Conforming: `hostHtml(view, online, lang, origin)`, given `location.origin` by `main.ts`; `joinLink(origin, code)` (`render.ts:38`).
- Non-conforming: a render function reading `location.origin` itself.

Check: review.

### Every value a player typed goes through `esc`

Names, room codes typed into the form, player ids put into attributes. App copy from `STRINGS` and card data from `DECK` need no escaping; card names are escaped anyway.

- Conforming: `${esc(p.name)}` (`render.ts:350`).
- Non-conforming: `${claim.name}` in a heading.

Check: review.

### Class strings are complete literals

Tailwind finds classes by scanning source for whole strings, so a class is never built from parts. A variant or size is a key into a `const` map of complete strings.

- Conforming: `BUTTON_VARIANT[variant]`, where each value is a full class (`render.ts:48-56`).
- Non-conforming: `` `btn-${variant}` ``, which Tailwind never generates.

Check: review. A missing class renders unstyled and fails nothing.

### Where a style goes

| Need                                                                             | Goes in                                                                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A daisyUI component or Tailwind class covers it                                  | The class, in `render.ts`                                                                                                       |
| A value used in more than one place, or one that needs a name (a card text size) | A token in `@theme`, `styles.css`                                                                                               |
| A look no class can draw (the bean, the strike-through)                          | A `@utility` in `styles.css`, with a comment                                                                                    |
| A rule every instance of a control must follow (the focus ring, the 44px button) | An unlayered rule in `styles.css`, so it wins over daisyUI's layered styles without specificity games                           |
| A theme color that fails contrast                                                | The `daisyui/theme` override block                                                                                              |
| A value computed at render time                                                  | An inline `style` of custom properties (`beanHtml`) or of a layout built from a core constant (the tabla grid, `render.ts:334`) |

- Non-conforming: a `<style>` block in a string, or `style="color: …"`.

Check: review.

### Behavior hangs on `data-*`, never on classes

`main.ts` dispatches every click through one listener on `#app` and `closest('[data-action]')` (`web/src/main.ts:240-305`), and reads `data-card`, `data-player`, `data-lang`, `data-rule` for the rest. The join form is found by its `submit` event. No script selects by class.

- Non-conforming: `app.querySelector('.btn-primary')`.

Check: review.

### Focusable elements can be found again

A control has an `id` or a `data-action` (with `data-card` for cells), so `render()` can restore focus after it replaces the page. See [states](../design-system/foundations/states.md#focus-survives-a-render).

Check: review.

### Live regions live in `index.html`

`#announcer` and `#notice` sit outside `#app` and are never re-created; scripts set their content.

Check: review.
