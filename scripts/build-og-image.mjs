/**
 * Draws the share image, app/opengraph-image.png, which Next turns into the
 * og:image tags for every page.
 *
 * Run by hand (`node scripts/build-og-image.mjs`) when the headline, the
 * wordmark or the palette changes, and commit the output, like the icons.
 * A static file rather than next/og's ImageResponse because that would put
 * a WebAssembly renderer and a font into the Worker bundle for one picture.
 *
 * The headline is set in Geist from the `geist` package's font file, through
 * sharp's text renderer, so it does not depend on the fonts installed on the
 * machine that runs this. Colours are the light-theme tokens in
 * app/globals.css (--cd-bg, --cd-text, --cd-text-muted); keep them in step.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const W = 1200;
const H = 630;
const PAD = 88;

const BG = "#F7F7F4";
const INK = "#16150F";
const MUTED = "#65645F";

const FONT = fileURLToPath(
  new URL("../node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf", import.meta.url),
);

/** Display size, and the site's -0.03em tracking in Pango's 1/1024 pt. */
const SIZE = 80;
const TRACK = Math.round(-0.03 * SIZE * 1024);

/** Pango markup: the claim in ink, the consequence in muted. */
const headline = sharp({
  text: {
    text:
      `<span letter_spacing="${TRACK}">` +
      `<span foreground="${INK}">Which card?</span>\n` +
      `<span foreground="${MUTED}">Answered before you pay.</span></span>`,
    font: `Geist Medium ${SIZE}`,
    fontfile: FONT,
    rgba: true,
    dpi: 72,
    spacing: -4,
  },
});
const headlineBuf = await headline.png().toBuffer();
const headlineMeta = await sharp(headlineBuf).metadata();

/** The owner's CREDIT DASH lettering, black on transparency, tinted to ink. */
const WORDMARK_H = 30;
const wordmark = await sharp("public/brand/wordmark.png")
  .resize({ height: WORDMARK_H })
  .ensureAlpha()
  .linear([0, 0, 0, 1], [0x16, 0x15, 0x0f, 0])
  .png()
  .toBuffer();

const out = await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([
    { input: wordmark, left: PAD, top: PAD },
    { input: headlineBuf, left: PAD, top: H - PAD - headlineMeta.height },
  ])
  .png({ palette: true, colours: 64, compressionLevel: 9 })
  .toBuffer();

const target = fileURLToPath(new URL("../app/opengraph-image.png", import.meta.url));
await writeFile(target, out);
console.log(`app/opengraph-image.png: ${W}x${H}, ${(out.length / 1024).toFixed(1)} KB`);
