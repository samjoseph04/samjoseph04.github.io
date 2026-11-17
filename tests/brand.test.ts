import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import BrandMark from '../apps/web/components/BrandMark';
import BrandLoading from '../apps/web/components/BrandLoading';
import { brandIcons, syncBrandIcons } from '../apps/web/lib/brand';
import { themeBoot } from '../apps/web/lib/theme';
import geometry from '../apps/web/brand/monogram.json';

const web = new URL('../apps/web/', import.meta.url);
const pathData = (svg: string) => [...svg.matchAll(/<path[^>]* d="([^"]+)"/g)].map((match) => match[1]);

test('all component sizes preserve the approved SVG paths, viewBox and grey-dot geometry', async () => {
  const source = await readFile(new URL('public/assets/sj-logo.svg', web), 'utf8');
  assert.deepEqual(geometry.paths, pathData(source));
  assert(source.includes(`viewBox="${geometry.viewBox}"`));
  for (const className of ['brand-monogram', 'footer-monogram', 'brand-loading-mark']) {
    const html = renderToStaticMarkup(createElement(BrandMark, { className }));
    assert.deepEqual(pathData(html), pathData(source));
    assert(html.includes(`viewBox="${geometry.viewBox}"`));
    assert(html.includes('cx="328" cy="189" r="40"'));
    assert(html.includes('fill="var(--tone-paper)"'));
    assert(html.includes('fill="var(--tone-secondary)"'));
    assert(!html.includes('<text'));
  }
  const loading = renderToStaticMarkup(createElement(BrandLoading));
  assert.deepEqual(pathData(loading), geometry.paths);
  assert(loading.includes('role="status"'));
  assert(!loading.includes('tabindex'));
});

test('generated SVG and multiresolution browser icons use the same mark and central palette', async () => {
  const css = await readFile(new URL('app/theme.css', web), 'utf8');
  for (const theme of ['dark', 'light'] as const) {
    const svg = await readFile(new URL(`public${brandIcons[theme].svg}`, web), 'utf8');
    assert.deepEqual(pathData(svg), geometry.paths);
    assert(svg.includes('transform="translate(28 59)"'));
    for (const role of ['background', 'text', 'muted']) {
      const color = css.match(new RegExp(`--${theme}-${role}:\\s*(#[0-9a-fA-F]{6})`))![1];
      assert(svg.includes(`fill="${color}"`));
    }
    const ico = await readFile(new URL(`public${brandIcons[theme].ico}`, web));
    assert.equal(ico.readUInt16LE(2), 1);
    assert.equal(ico.readUInt16LE(4), 3);
    for (const [index, size] of [16, 32, 48].entries()) {
      const entry = 6 + index * 16;
      const offset = ico.readUInt32LE(entry + 12);
      const png = ico.subarray(offset, offset + ico.readUInt32LE(entry + 8));
      const meta = await sharp(png).metadata();
      assert.equal(meta.width, size);
      assert.equal(meta.height, size);
      assert.equal(meta.format, 'png');
    }
  }
  assert.equal(await readFile(new URL('public/icon.svg', web), 'utf8'),
    await readFile(new URL('public/brand/favicon-dark.svg', web), 'utf8'));
});

test('browser icons follow saved themes before paint and the live selection, independently of OS', () => {
  for (const saved of [null, 'dark', 'light', 'invalid']) {
    const links = ['svg', 'ico'].map((format) => ({ dataset: { brandIcon: format }, href: '',
      setAttribute(name: string, value: string) { assert.equal(name, 'href'); this.href = value; } }));
    const document = { documentElement: { dataset: {} as Record<string, string> },
      querySelectorAll: () => links };
    runInNewContext(themeBoot, { document, localStorage: { getItem: () => saved } });
    const expected = saved === 'light' ? 'light' : 'dark';
    assert.equal(document.documentElement.dataset.theme, expected);
    assert.deepEqual(links.map((link) => link.href), Object.values(brandIcons[expected]));
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', { value: document, configurable: true });
    try {
      const next = expected === 'dark' ? 'light' : 'dark';
      syncBrandIcons(next);
      assert.deepEqual(links.map((link) => link.href), Object.values(brandIcons[next]));
    } finally {
      if (previous) Object.defineProperty(globalThis, 'document', previous);
      else Reflect.deleteProperty(globalThis, 'document');
    }
  }
});

test('bootstrap owns exactly one icon per format across repeated initialization and blocked storage', () => {
  const links: { dataset: Record<string, string>; href: string; setAttribute: (name: string, value: string) => void }[] = [];
  const document = {
    documentElement: { dataset: {} as Record<string, string> },
    querySelectorAll: () => links,
    createElement: () => ({ dataset: {}, href: '', setAttribute(name: string, value: string) {
      assert.equal(name, 'href'); this.href = value;
    } }),
    head: { appendChild(link: typeof links[number]) { links.push(link); } },
  };
  for (let count = 0; count < 2; count++) {
    runInNewContext(themeBoot, { document, localStorage: { getItem: () => 'light' } });
    assert.equal(links.length, 2);
    assert.deepEqual(links.map((link) => link.href), Object.values(brandIcons.light));
  }
  runInNewContext(themeBoot, { document, localStorage: { getItem() { throw new Error('blocked'); } } });
  assert.equal(links.length, 2);
  assert.deepEqual(links.map((link) => link.href), Object.values(brandIcons.dark));
});
