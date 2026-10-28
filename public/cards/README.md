# Card art

Drop a file named after the card id here and `CardFace` picks it up with no
code change:

```
public/cards/amex-gold.webp
```

Recommended 1536x969 WebP (the ISO/IEC 7810 ID-1 ratio, 1.586:1).

Where no file exists, `CardFace` draws the card from its own `faceStyle` data
instead. That fallback is not a placeholder; it is what most cards will use
until art is licensed, so a missing file is never a broken image.

A card can also point somewhere else by setting `imagePath` in
`data/cards.seed.ts`, which overrides the name-based lookup.

## Licensing

Art from cardart.cc is licensed for personal, non-commercial use. Because
Premium is a paid plan, get the creator's permission and credit them before
shipping their work, or keep using the generated face for that card.
