// The approved SVG is the only authored geometry. All runtime/icon assets below
// are derived from it; never redraw or substitute type for the SJ paths.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const web = new URL('../apps/web/', import.meta.url);
const source = await readFile(new URL('public/assets/sj-logo.svg', web), 'utf8');
const viewBox = source.match(/viewBox="([^"]+)"/)[1];
const paths = [...source.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]);
const circle = source.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/);
if (viewBox !== '0 0 376 314' || paths.length !== 2 || !circle)
  throw new Error('Approved SJ source structure changed; review before generating assets.');
const geometry = { viewBox, paths, dot: { cx: +circle[1], cy: +circle[2], r: +circle[3] } };
await mkdir(new URL('brand/', web), { recursive: true });
await writeFile(new URL('brand/monogram.json', web), `${JSON.stringify(geometry, null, 2)}\n`);

const css = await readFile(new URL('app/theme.css', web), 'utf8');
function token(name) {
  const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1];
  if (!value) throw new Error(`Missing theme primitive: ${name}`);
  return value;
}
function icon(theme) {
  // Square application with identical optical padding in both themes. The
  // approved mark is only translated; its paths and aspect ratio stay intact.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432"><rect width="432" height="432" rx="76" fill="${token(`${theme}-background`)}"/><g transform="translate(28 59)" fill="${token(`${theme}-text`)}">${paths.map((d) => `<path d="${d}"/>`).join('')}<circle cx="${geometry.dot.cx}" cy="${geometry.dot.cy}" r="${geometry.dot.r}" fill="${token(`${theme}-muted`)}"/></g></svg>\n`;
}
async function ico(svg) {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  pngs.forEach((png, index) => {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...pngs]);
}
await mkdir(new URL('public/brand/', web), { recursive: true });
for (const theme of ['dark', 'light']) {
  const svg = icon(theme);
  const raster = await ico(svg);
  await writeFile(new URL(`public/brand/favicon-${theme}.svg`, web), svg);
  await writeFile(new URL(`public/brand/favicon-${theme}.ico`, web), raster);
  if (theme === 'dark') {
    // Legacy paths remain valid, now displaying the same approved design.
    await writeFile(new URL('public/icon.svg', web), svg);
    await writeFile(new URL('public/favicon.ico', web), raster);
  }
}
console.log('Generated SJ component geometry and dark/light browser icons from the approved SVG.');
