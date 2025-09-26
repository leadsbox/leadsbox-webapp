
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = Exclude<Theme, 'system'>;

type AccentColor = {
  name: string;
  value: string;
  hsl: string;
};

const STORAGE_KEYS = {
  theme: 'theme',
  accent: 'accentColor',
} as const;

const accentColors: AccentColor[] = [
  { name: 'Blue', value: 'blue', hsl: '221 83% 53%' },
  { name: 'Purple', value: 'purple', hsl: '262 83% 58%' },
  { name: 'Green', value: 'green', hsl: '142 76% 36%' },
  { name: 'Orange', value: 'orange', hsl: '25 95% 53%' },
  { name: 'Red', value: 'red', hsl: '0 84% 60%' },
  { name: 'Pink', value: 'pink', hsl: '330 81% 60%' },
  { name: 'Teal', value: 'teal', hsl: '173 58% 39%' },
  { name: 'Indigo', value: 'indigo', hsl: '239 84% 67%' },
];

const defaultAccent = accentColors[0];

const getSystemPreference = (): ResolvedTheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
  return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system';
};

const getInitialResolvedTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  const initial = getInitialTheme();
  return initial === 'system' ? getSystemPreference() : initial;
};

const loadAccentFromStorage = (): AccentColor => {
  if (typeof window === 'undefined') return defaultAccent;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.accent);
    if (!stored) return defaultAccent;
    const parsed = JSON.parse(stored) as Partial<AccentColor>;
    const match = accentColors.find((color) => color.value === parsed.value);
    if (match) return match;
    if (parsed.name && parsed.value && parsed.hsl) {
      return parsed as AccentColor;
    }
    return defaultAccent;
  } catch (error) {
    console.warn('Failed to parse stored accent color, falling back to default.', error);
    return defaultAccent;
  }
};

const applyThemeToDocument = (resolved: ResolvedTheme) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
};

const updateAccentVariables = (accent: AccentColor) => {
  const root = window.document.documentElement;
  root.style.setProperty('--primary', accent.hsl);
  root.style.setProperty('--accent', accent.hsl);
  root.style.setProperty('--brand', accent.hsl);
  root.style.setProperty('--nav-active', accent.hsl);
  root.style.setProperty('--sidebar-primary', accent.hsl);
  root.style.setProperty('--sidebar-ring', accent.hsl);
  root.style.setProperty('--ring', accent.hsl);

  const [h, s, l] = accent.hsl.split(' ').map((part) => parseFloat(part));
  if (Number.isFinite(h) && Number.isFinite(s) && Number.isFinite(l)) {
    const hoverLightness = Math.max(0, Math.min(100, l - 5));
    root.style.setProperty('--primary-hover', `${h} ${s}% ${hoverLightness}%`);
  }
};

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentColors: AccentColor[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(getInitialResolvedTheme);
  const [accentColor, setAccentColor] = useState<AccentColor>(loadAccentFromStorage);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextResolved = theme === 'system' ? getSystemPreference() : theme;
    applyThemeToDocument(nextResolved);
    setResolvedTheme(nextResolved);
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    updateAccentVariables(accentColor);
    window.localStorage.setItem(STORAGE_KEYS.accent, JSON.stringify(accentColor));
  }, [accentColor]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      if (theme !== 'system') return;
      const nextResolved = event.matches ? 'dark' : 'light';
      applyThemeToDocument(nextResolved);
      setResolvedTheme(nextResolved);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        accentColor,
        setAccentColor,
        accentColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
