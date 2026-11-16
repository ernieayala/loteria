# Seat list

The players in the caller's room, each as a badge with a connection dot.

## Function

`seatsHtml(players, t)` (`packages/web/src/render.ts:330-338`): a `<ul>` of daisyUI badges, `gap-1.5`, in one row that scrolls sideways, under the "Players (n)" heading. Each badge is `shrink-0 whitespace-nowrap`. The list takes focus (`tabindex="0"`, labelled by the heading) so a keyboard can scroll it.

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

**The list is one row.** Like the [called row](called-row.md), it scrolls sideways, so ten players take no more height than one and the card or tabla below keeps its room on a short phone.

- Check: review.
