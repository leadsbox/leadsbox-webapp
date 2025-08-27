
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type AccentColor = {
  name: string;
  value: string;
  hsl: string;
};

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

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentColors: AccentColor[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });
  
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const stored = localStorage.getItem('accentColor');
    return stored ? JSON.parse(stored) : accentColors[0];
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Update CSS custom properties for accent color
    root.style.setProperty('--primary', accentColor.hsl);
    root.style.setProperty('--accent', accentColor.hsl);
    root.style.setProperty('--brand', accentColor.hsl);
    root.style.setProperty('--nav-active', accentColor.hsl);
    root.style.setProperty('--sidebar-primary', accentColor.hsl);
    root.style.setProperty('--sidebar-ring', accentColor.hsl);
    root.style.setProperty('--ring', accentColor.hsl);
    
    localStorage.setItem('accentColor', JSON.stringify(accentColor));
  }, [accentColor]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleSetAccentColor = (color: AccentColor) => {
    setAccentColor(color);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor: handleSetAccentColor,
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
