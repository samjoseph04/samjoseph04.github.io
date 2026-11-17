import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeTheme, readTheme, saveTheme, themeBoot, themePreferenceKey } from '../apps/web/lib/theme';
import ThemeToggle from '../apps/web/components/ThemeToggle';

test('theme bootstrap applies only a validated saved choice before hydration; dark is the default', () => {
  for (const value of [null, 'dark', 'light', 'system', '<script>', '', 'LIGHT']) {
    const dataset: Record<string, string> = {};
    runInNewContext(themeBoot, {
      document: { documentElement: { dataset } },
      localStorage: { getItem: (key: string) => { assert.equal(key, themePreferenceKey); return value; } },
    });
    assert.equal(dataset.theme, value === 'light' ? 'light' : 'dark');
    assert.equal(readTheme({ getItem: () => value }), dataset.theme);
    assert.equal(normalizeTheme(value), dataset.theme);
  }
});

test('blocked or missing storage fails safely to dark without breaking first paint', () => {
  for (const storage of [undefined, { getItem() { throw new Error('Storage blocked'); } }]) {
    const dataset: Record<string, string> = {};
    runInNewContext(themeBoot, { document: { documentElement: { dataset } }, localStorage: storage });
    assert.equal(dataset.theme, 'dark');
  }
  assert.equal(readTheme({ getItem() { throw new Error('blocked'); } }), 'dark');
});

test('theme preference round-trips using an isolated key and tolerates write failures', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => { values.set(key, value); } };
  for (const theme of ['light', 'dark'] as const) {
    assert(saveTheme(storage, theme));
    assert.equal(readTheme(storage), theme);
  }
  assert.deepEqual([...values.keys()], [themePreferenceKey]);
  assert(!saveTheme({ setItem() { throw new Error('quota'); } }, 'light'));
});

test('theme control has native keyboard semantics and a truthful no-JS disabled state', () => {
  const html = renderToStaticMarkup(createElement(ThemeToggle));
  assert(html.includes('type="button"'));
  assert(html.includes('aria-label="Light mode"'));
  assert(html.includes('aria-pressed="false"'));
  assert(html.includes('disabled=""'));
  assert(html.includes('Theme switching requires JavaScript'));
  assert(html.includes('role="status"'));
});
