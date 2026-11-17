// Standard image encoding for delivery, with no crop, retouching, or creative edits.
// The supplied JPEG remains byte-for-byte intact alongside the WebP derivatives.
import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const directory = new URL('../apps/web/public/assets/', import.meta.url);
const source = new URL('sam-joseph-portrait.jpeg', directory);
for (const width of [720, 1200, 1800]) {
  const filename =
    width === 1800 ? 'sam-joseph-portrait.webp' : `sam-joseph-portrait-${width}.webp`;
  await sharp(fileURLToPath(source))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(fileURLToPath(new URL(filename, directory)));
  const info = await stat(new URL(filename, directory));
  console.log(`${filename}: ${Math.round(info.size / 1024)} KB`);
}
