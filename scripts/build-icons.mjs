/**
 * Generates every app icon from one drawing: the favicon set, the Apple
 * touch icon and the PWA manifest icons.
 *
 * Run by hand (`node scripts/build-icons.mjs`) when the mark changes, and
 * commit the output. It is not part of the build because the icons only
 * change when the mark does, and rasterising on every deploy would be waste.
 *
 * The mark is two cards, one behind the other: a wallet, drawn in the
 * product's own ink and pastels. It is drawn with shapes only, no text, so
 * it rasterises the same anywhere without needing the display font. The
 * colours are the light-theme token values from app/globals.css; keep them
 * in step if the palette changes.
 */

import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const INK = "#0b0b0c";
const PAPER = "#fafaf9";
const MINT = "#d7f2e3";
const BUTTER = "#fbf1c7";

/**
 * The cards sit well inside the central 80% circle a maskable icon is
 * guaranteed to show, so Android's crop never clips them.
 */
const cards = `
  <rect x="140" y="138" width="260" height="164" rx="22" fill="${MINT}"
        transform="rotate(-9 270 220)"/>
  <rect x="112" y="200" width="288" height="182" rx="24" fill="${PAPER}"/>
  <rect x="146" y="246" width="50" height="38" rx="9" fill="${BUTTER}"/>
  <rect x="146" y="334" width="120" height="14" rx="7" fill="${INK}" opacity="0.18"/>
`;

/** Full bleed. Platforms that mask or round the icon themselves get this. */
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${INK}"/>${cards}</svg>`;

/** Rounded, for places that show the icon as drawn (tabs, desktop installs). */
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${INK}"/>${cards}</svg>`;

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();

/**
 * An .ico is a small header and directory around embedded PNGs. Writing it
 * directly avoids a dependency for the one file every browser still asks
 * for at /favicon.ico.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await mkdir("public/icons", { recursive: true });

const favicons = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) })),
);

await Promise.all([
  writeFile("app/favicon.ico", ico(favicons)),
  writeFile("app/icon.svg", rounded),
  writeFile("app/apple-icon.png", await png(square, 180)),
  writeFile("public/icons/icon-192.png", await png(rounded, 192)),
  writeFile("public/icons/icon-512.png", await png(rounded, 512)),
  writeFile("public/icons/maskable-512.png", await png(square, 512)),
]);

console.log("Icons written: app/favicon.ico, app/icon.svg, app/apple-icon.png, public/icons/*");
