import { Toaster } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

const resolveTheme = (theme: string | undefined) => {
  if (!theme || theme === 'system') {
    return 'system';
  }
  return theme === 'dark' ? 'dark' : 'light';
};

export const LeadsboxToaster = () => {
  const { theme, resolvedTheme } = useTheme();
  const activeTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <Toaster
      closeButton
      theme={resolveTheme(theme)}
      position="bottom-right"
      visibleToasts={4}
      richColors
      expand
      duration={3200}
      toastOptions={{
        className:
          'group pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg border border-border/60 bg-background/95 p-4 text-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80',
        classNames: {
          description: 'text-sm text-muted-foreground',
          actionButton:
            'rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
          closeButton:
            'text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border',
        },
        style: {
          backdropFilter: 'blur(10px)',
        },
      }}
    />
  );
};

export default LeadsboxToaster;
