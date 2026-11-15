# Motion

Motion shows one thing: a bean landing on a card. Everything else appears in place.

## What moves

| Motion                                                                                                                                                                                      | Duration                | Reduced motion                      | Where                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------- | ----------------------------------------------- |
| The bean roll: it drops in at the top of the card, strikes one side, bounces to the other, rolls back and wobbles to rest (`bean-path`), tumbling in perspective as it goes (`bean-tumble`) | `BEAN_ROLL_MS`, 1100ms  | The bean appears at its spot        | `styles.css:82-170`, `render.ts:222`            |
| A tabla cell under the finger, shrunk to 95%                                                                                                                                                | Instant (no transition) | No change                           | `motion-safe:active:scale-95` (`render.ts:300`) |
| A notice toast sliding in                                                                                                                                                                   | 0.25s                   | Appears in place                    | daisyUI `toast`                                 |
| The connecting dots                                                                                                                                                                         | daisyUI's loop          | Static                              | daisyUI `loading-dots`                          |
| A button's color on press                                                                                                                                                                   | 0.2s, with a 0.5px drop | Unchanged; neither moves the layout | daisyUI `btn`                                   |

## Rules

### Animation waits for `prefers-reduced-motion: no-preference`

New motion goes inside `@media (prefers-reduced-motion: no-preference)` or a `motion-safe:` variant, so reduced motion is the default and motion is the addition.

- Conforming: `bean-rolling` (`styles.css:161-170`).
- Non-conforming: `animate-bounce` on the winner heading.

Check: review.

### One duration, one source

A duration both the script and the CSS need is a constant in TypeScript passed to CSS as a custom property. `BEAN_ROLL_MS` becomes `--roll-ms` (`render.ts:256`), so the two cannot disagree.

- Non-conforming: `1100ms` written in `styles.css`.

Check: review.

### A re-render continues a roll

A render in the middle of a roll (another bean, a language switch) starts the animation as far in as it had got: `main.ts` keeps when each bean was put down (`thrownAt`, `main.ts:67`) and the render passes `--roll-elapsed` as a negative delay. A bean on the first view after joining or reconnecting was already down and does not roll (`main.ts:176-179`).

- Non-conforming: restarting the roll on every render, so a bean leaps back to the top when another lands.

Check: review.

### A bean rests in the same place everywhere

Its spot and path are drawn from the round and the card with the seeded generator (`beanSpot`, `render.ts:232-252`), not from `Math.random`, so it lies in the same place on every render and on the caller's screen as on the player's phone. Every waypoint stays on the card, and the rest spot stays in the middle 60%.

Check: `render.test.ts` (`beanSpot`: bounds, the side-to-side bounce, the same spot every time, and the spread).
