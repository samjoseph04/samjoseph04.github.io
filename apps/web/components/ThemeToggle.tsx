'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { normalizeTheme, saveTheme, themePreferenceKey, type Theme } from '../lib/theme';
import { syncBrandIcons } from '../lib/brand';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    // Public bootstrap already applied the preference before paint. The separate
    // admin-preview document has no bootstrap, so it starts dark by design.
    const current = normalizeTheme(root.dataset.theme);
    root.dataset.theme = current;
    syncBrandIcons(current);
    setTheme(current);
    setReady(true);
    const frame = requestAnimationFrame(() => { root.dataset.themeReady = 'true'; });
    const sync = (event: StorageEvent) => {
      if (event.key !== themePreferenceKey && event.key !== null) return;
      const next = normalizeTheme(event.key === null ? null : event.newValue);
      root.dataset.theme = next;
      syncBrandIcons(next);
      setTheme(next);
    };
    // A bfcache page can miss storage events while frozen. Re-read on restore;
    // unavailable storage keeps the visitor's in-memory choice intact.
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      try {
        const next = normalizeTheme(localStorage.getItem(themePreferenceKey));
        root.dataset.theme = next;
        syncBrandIcons(next);
        setTheme(next);
      } catch {}
    };
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', restore);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', restore);
      root.removeAttribute('data-theme-ready');
    };
  }, []);

  function toggle() {
    const next = normalizeTheme(document.documentElement.dataset.theme) === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    syncBrandIcons(next);
    setTheme(next);
    setAnnouncement(`${next === 'light' ? 'Light' : 'Dark'} mode enabled`);
    // Accessing localStorage itself can throw, even before its methods are called.
    try { saveTheme(localStorage, next); } catch {}
  }

  return (
    <>
      <button
        type="button"
        className="theme-toggle"
        aria-label="Light mode"
        aria-pressed={theme === 'light'}
        disabled={!ready}
        title={ready ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Theme switching requires JavaScript'}
        onClick={toggle}
      >
        <motion.span
          className="theme-toggle-icons"
          aria-hidden="true"
          initial={false}
          animate={{ rotate: theme === 'light' ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Moon className="theme-moon" size={18} />
          <Sun className="theme-sun" size={18} />
        </motion.span>
      </button>
      <span className="sr-only" role="status">{announcement}</span>
    </>
  );
}
