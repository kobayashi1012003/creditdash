# Card art

Drop a file named after the card id here and `CardFace` picks it up with no
code change:

```
public/cards/amex-gold.webp
```

Recommended 1536x969 WebP (the ISO/IEC 7810 ID-1 ratio, 1.586:1). Flatten
any transparent rounded corners onto the card's colour first: `CardFace`
rounds the card itself, at its own radius, so transparency shows the page
through the corners.

Every build cuts 480, 720 and 960 px copies into `w/` (gitignored) and
`CardFace` serves the smallest one that is sharp enough. Next's image
optimiser does not resize on Cloudflare Workers, so without those copies
every thumbnail would download the full file. Never commit `w/`.

Where no file exists, `CardFace` draws the card from its own `faceStyle` data
instead, so a missing file is never a broken image.

A card can also point somewhere else by setting `imagePath` in
`data/cards.seed.ts`, which overrides the name-based lookup. Those files are
served as they are, without the cut copies.

## Licensing

The art in this folder is used with the owner's confirmed permission. For
anything added later: art from cardart.cc is licensed for personal,
non-commercial use, and Premium is a paid plan, so get the creator's
permission and credit them before shipping their work, or keep using the
generated face for that card.
