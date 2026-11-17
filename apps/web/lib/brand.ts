import type { Theme } from './theme';

export const brandIcons = {
  dark: { svg: '/brand/favicon-dark.svg', ico: '/brand/favicon-dark.ico' },
  light: { svg: '/brand/favicon-light.svg', ico: '/brand/favicon-light.ico' },
} as const;

export function syncBrandIcons(theme: Theme) {
  document.querySelectorAll<HTMLLinkElement>('link[data-brand-icon]').forEach((link) => {
    link.setAttribute('href', brandIcons[theme][link.dataset.brandIcon === 'ico' ? 'ico' : 'svg']);
  });
}
