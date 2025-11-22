import { ThemeProvider, type Theme } from './context/ThemeContext';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const applyInitialThemePreference = () => {
  if (typeof window === 'undefined') return;

  try {
    const root = window.document.documentElement;
    const storedTheme = window.localStorage.getItem('theme') as Theme | null;
    const theme: Theme = storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system' ? storedTheme : 'system';
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;

    const storedAccent = window.localStorage.getItem('accentColor');
    if (storedAccent) {
      const parsed = JSON.parse(storedAccent) as { hsl?: string } | null;
      const accentHsl = parsed?.hsl;
      if (accentHsl) {
        root.style.setProperty('--primary', accentHsl);
        root.style.setProperty('--accent', accentHsl);
        root.style.setProperty('--brand', accentHsl);
        root.style.setProperty('--nav-active', accentHsl);
        root.style.setProperty('--sidebar-primary', accentHsl);
        root.style.setProperty('--sidebar-ring', accentHsl);
        root.style.setProperty('--ring', accentHsl);

        const [h, s, l] = accentHsl.split(' ').map((part) => parseFloat(part));
        if (Number.isFinite(h) && Number.isFinite(s) && Number.isFinite(l)) {
          const hoverLightness = Math.max(0, Math.min(100, l - 5));
          root.style.setProperty('--primary-hover', `${h} ${s}% ${hoverLightness}%`);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to apply saved theme preference before hydration.', error);
  }
};

applyInitialThemePreference();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);
