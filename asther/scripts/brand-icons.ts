// Regenerates favicon and PWA icons from public/brand/symbol.png.
// Brand guideline 2.0: the avatar is a Hijau square with the symbol in Kertas.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const SYMBOL = "public/brand/symbol.png";
const HIJAU = "#0B5232";
const KERTAS = "#F3F2EF";

async function avatar(size: number, symbolRatio: number) {
  const inner = Math.round(size * symbolRatio);
  const glyph = await sharp(SYMBOL)
    .resize(inner, inner, { fit: "contain" })
    .toBuffer();
  // Recolor the symbol to a single color by using its alpha as a mask.
  const mono = await sharp({
    create: { width: inner, height: inner, channels: 4, background: KERTAS },
  })
    .composite([{ input: glyph, blend: "dest-in" }])
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: HIJAU },
  })
    .composite([{ input: mono, gravity: "center" }])
    .png()
    .toBuffer();
}

// An .ico file may embed PNG images directly.
function ico(images: Array<{ size: number; png: Buffer }>) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.png)]);
}

await writeFile("public/icon-192.png", await avatar(192, 0.62));
await writeFile("public/icon-512.png", await avatar(512, 0.62));
// Maskable icons keep the symbol inside the 80% safe zone.
await writeFile("public/icon-192-maskable.png", await avatar(192, 0.5));
await writeFile("public/icon-512-maskable.png", await avatar(512, 0.5));
await writeFile("public/apple-touch-icon.png", await avatar(180, 0.62));
const favicon = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, png: await avatar(size, 0.7) })),
);
await writeFile("public/favicon.ico", ico(favicon));
await writeFile("src/app/favicon.ico", ico(favicon));
console.log("Brand icons generated.");
