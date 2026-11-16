# Card face

One called card standing alone: the caller's current card, and the last call on a player's phone while Last card is on. Earlier calls are thumbnails in the [called row](called-row.md), on the caller's screen only.

## Anatomy

```
+---------------+
| 17  (printed) |   the whole card art, object-contain, drop-shadow
|    picture    |
|   [ Kiwa ]    |   Kichwa name, printed on the art
+---------------+
      Herb          meaning in the page's language (figcaption, text-2xl font-bold)
```

## Function

`currentCardHtml(id, t)` (`packages/web/src/render.ts`): a `<figure>` with two grid rows, the art (`minmax(0,1fr)`) and the meaning (`auto`).

The figure is a size container (`[container-type:size]`), so it has no size of its own and takes the slot the screen leaves: `cardSectionHtml(id, label, t, attrs?)` puts it in a labelled grid track that fills the flexible area, for `hostHtml` and `playerHtml` alike. Without containment the art's own pixels would set the slot's height and push the main action off the screen.

## Screen reader

The `<img>` has `alt="17, Kiwa"` and `lang="qu"`: number then name, in Kichwa. The figcaption is read after it in the page's language.

## Long text

The meaning wraps between words, centered. Meanings are short by rule: a word or two from the game's word list ([localization](../content/localization.md)).

## Rules

**The meaning is shown, the name is printed.** The caller reads the Kichwa word from the art, then its meaning from the caption, as the printed game's instructions say.

- Check: `render.test.ts` ("shows the drawn card with its meaning").

**The name is escaped** with `esc`, though it comes from `DECK`, so a face never trusts its input.

- Check: review.
