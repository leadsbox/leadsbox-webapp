import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

const resolveTheme = (theme: string | undefined) => {
  if (!theme || theme === 'system') {
    return 'system';
  }
  return theme === 'dark' ? 'dark' : 'light';
};

export const LeadsboxToaster = () => {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mediaQuery.matches);
    update();

    mediaQuery.addEventListener('change', update);
    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

  return (
    <Toaster
      closeButton
      theme={resolveTheme(theme)}
      position={isMobile ? 'top-center' : 'bottom-right'}
      visibleToasts={isMobile ? 2 : 4}
      offset={12}
      richColors
      expand
      duration={3200}
      toastOptions={{
        className:
          'group pointer-events-auto flex w-full max-w-[min(420px,calc(100vw-1rem))] items-start gap-3 rounded-xl border border-border bg-background p-4 text-foreground shadow-xl',
        classNames: {
          description: 'text-sm leading-relaxed text-muted-foreground',
          actionButton:
            'rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
          closeButton: 'text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border',
        },
      }}
    />
  );
};

export default LeadsboxToaster;
