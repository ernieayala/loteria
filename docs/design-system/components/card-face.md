# Card face

One called card standing alone: the caller's current card, and a call a player tapped in their [called row](called-row.md#showing-a-call-large), shown large for a few seconds. Earlier calls are thumbnails in the called row.

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

`currentCardHtml(id, t)` (`packages/web/src/render.ts`): a `<figure>` with two grid rows, the art (`minmax(0,1fr)`) and the meaning (`auto`). The art is `absolute inset-0` inside a `relative` box that stretches over its row, as on a [tabla](tabla.md) card. An `<img>` sized by percentage as the grid item itself is drawn the whole figure's height in Safari, over the meaning.

The figure is a size container (`[container-type:size]`), so it has no size of its own and takes the slot the screen leaves: `cardSectionHtml(id, label, t)` puts it in a labelled grid track that fills the flexible area of `hostHtml`; `zoomedCardHtml` puts it in a fixed-height panel over a player's screen. Without containment the art's own pixels would set the slot's height and push the main action off the screen.

## Screen reader

The `<img>` has `alt="17, Kiwa"` and `lang="qu"`: number then name, in Kichwa. The figcaption is read after it in the page's language.

## Long text

The meaning wraps between words, centered. Meanings are short by rule: a word or two from the game's word list ([localization](../content/localization.md)).

## Rules

**The meaning is shown, the name is printed.** The caller reads the Kichwa word from the art, then its meaning from the caption, as the printed game's instructions say.

- Check: `render.test.ts` ("shows the drawn card with its meaning").

**The name is escaped** with `esc`, though it comes from `DECK`, so a face never trusts its input.

- Check: review.
