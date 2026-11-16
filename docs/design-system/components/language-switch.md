# Language switch

The switch to the other language, in every screen's header.

## Function

`langSwitchHtml(lang)` (`packages/web/src/render.ts:93-101`): a `ghost` `compact` button with `action: 'lang'`, `data-lang` set to the other language, and `lang` on the button.

## Rules

**The label is the other language's own name.** A reader of that language finds it: an English page shows "Español", a Spanish page shows "English" (`languageName` in `i18n.ts`).

- Don't: "Spanish" on an English page.
- Check: review.

**The button carries `lang`,** so a screen reader pronounces "Español" with a Spanish voice.

- Check: review.

**Every screen with a header has one.** `homeHtml`, `joinHtml`, `hostHtml`, and `playerHtml` each place it in the header; `waitingHtml`, a spinner shown for a moment, has no header.

- Check: review.

The choice is saved (`saveLang`) and wins over the browser's languages on the next visit; see [localization](../content/localization.md).
