/**
 * useTheme – manages light / dark / system theme.
 * Tailwind is configured with darkMode: ['class'], so we toggle the `dark`
 * class on the <html> element. The preference is saved to localStorage.
 */

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'lb_theme';

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
  });

  // Apply on mount and whenever OS preference changes (relevant for "system")
  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

  return { theme, resolvedTheme, setTheme };
};
