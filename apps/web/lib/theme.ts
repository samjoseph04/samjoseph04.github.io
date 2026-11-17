import { brandIcons } from './brand';

export type Theme = 'dark' | 'light';
export const themePreferenceKey = 'sj-portfolio-theme';
export const normalizeTheme = (value: unknown): Theme => value === 'light' ? 'light' : 'dark';

export function readTheme(storage: Pick<Storage, 'getItem'>): Theme {
  try { return normalizeTheme(storage.getItem(themePreferenceKey)); }
  catch { return 'dark'; }
}

export function saveTheme(storage: Pick<Storage, 'setItem'>, theme: Theme) {
  try { storage.setItem(themePreferenceKey, theme); return true; }
  catch { return false; }
}

// Fixed trusted code, executed in <head> before body paint. No OS auto-detection:
// first-time visitors always get dark, even if their system prefers light.
export const themeBoot = `try {
  document.documentElement.dataset.theme =
    localStorage.getItem('${themePreferenceKey}') === 'light' ? 'light' : 'dark';
} catch (e) { document.documentElement.dataset.theme = 'dark'; }
try {
  var icons = ${JSON.stringify(brandIcons)};
  // Bootstrap owns these nodes. React resource hoisting otherwise duplicates
  // links whose href was changed to the saved light theme before hydration.
  if (!document.querySelectorAll('link[data-brand-icon]').length) {
    ['svg', 'ico'].forEach(function (format) {
      var link = document.createElement('link');
      link.rel = 'icon';
      link.type = format === 'svg' ? 'image/svg+xml' : 'image/x-icon';
      if (format === 'ico') link.sizes = '16x16 32x32 48x48';
      link.dataset.brandIcon = format;
      document.head.appendChild(link);
    });
  }
  document.querySelectorAll('link[data-brand-icon]').forEach(function (link) {
    link.setAttribute('href', icons[document.documentElement.dataset.theme][link.dataset.brandIcon === 'ico' ? 'ico' : 'svg']);
  });
} catch (e) {}`;

