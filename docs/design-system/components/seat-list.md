# Seat list

The players in the caller's room, each as a badge with a connection dot.

## Function

`seatsHtml(players, t)` (`packages/web/src/render.ts:313-321`): a wrapping `<ul>` of daisyUI badges, `gap-1.5`, under the "Players (n)" heading.

## States

| State      | Badge                                                    | Dot          | Screen reader              |
| ---------- | -------------------------------------------------------- | ------------ | -------------------------- |
| Online     | `badge-outline`                                          | `bg-success` | The name                   |
| Offline    | `badge-ghost` (no border)                                | `bg-edge`    | The name, then ", offline" |
| Empty room | No list: "Nobody yet. Share the code to invite players." |              | The sentence               |

## Rules

**Online and offline differ in shape, not only color:** an outlined badge against a borderless one.

- Check: review.

**Names are escaped.** Strangers type them.

- Check: review.

**The list wraps.** Unlike the [called row](called-row.md), seats are read at a glance and wrap onto as many lines as they need.

- Check: review.
