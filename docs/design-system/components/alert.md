# Alert

daisyUI `alert`, in two uses.

| Use                 | Function                                             | Classes                            | Shown                                                         |
| ------------------- | ---------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| Reconnecting banner | `offlineBannerHtml(online, t)` (`render.ts:430-431`) | `alert alert-warning py-2 text-sm` | First row of every screen while the socket is down            |
| Notice              | `noticeHtml(notice)` (`render.ts:703-705`)           | `alert alert-info shadow-lg`       | In the `#notice` toast for `NOTICE_MS` (2600ms, `main.ts:42`) |

Both colors are the darkened theme roles ([color](../foundations/color.md#a-theme-color-that-fails-aa-is-darkened-in-the-theme-never-patched-per-use)).

## Screen reader

The banner is plain text in the page. The notice renders into `#notice`, which sits outside `#app` with `role="alert"` (`index.html:12`), so its words are read as they arrive. See [feedback](../patterns/feedback.md).

## Rules

**A notice is one short sentence, ending in a period or an ellipsis.** `noticeHtml` escapes it.

- Check: review.

**A new notice replaces the old one** and restarts its timer (`flash`, `main.ts:151-157`).

- Check: review.
