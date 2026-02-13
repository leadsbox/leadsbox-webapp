import { ThemeProvider, type Theme } from './context/ThemeContext';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import LeadsboxToaster from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmProvider, NetworkBannerProvider, NetworkBannerSurface } from '@/ui/ux';
import { initAnalytics } from './lib/analytics';

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
initAnalytics();

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <NetworkBannerProvider>
        <ConfirmProvider>
          <TooltipProvider>
            <LeadsboxToaster />
            <div className='pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4'>
              <NetworkBannerSurface className='max-w-3xl' />
            </div>
            <App />
          </TooltipProvider>
        </ConfirmProvider>
      </NetworkBannerProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
