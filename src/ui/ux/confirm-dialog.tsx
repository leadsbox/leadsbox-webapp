import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmOptions, setConfirmImpl } from './utils';

type ConfirmVariant = 'default' | 'destructive';

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = React.createContext<ConfirmContextValue | undefined>(undefined);

type ProviderProps = {
  children: React.ReactNode;
};

export const ConfirmProvider = ({ children }: ProviderProps) => {
  const [state, setState] = React.useState<ConfirmState | null>(null);
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const confirmRef = React.useRef<HTMLButtonElement | null>(null);

  const restoreFocus = React.useCallback(() => {
    const target = lastFocusedRef.current;
    window.requestAnimationFrame(() => {
      target?.focus?.({ preventScroll: true });
      lastFocusedRef.current = null;
    });
  }, []);

  const closeDialog = React.useCallback(
    (confirmed: boolean) => {
      if (!state) {
        return;
      }
      state.resolve(confirmed);
      setState(null);
      restoreFocus();
    },
    [state, restoreFocus]
  );

  const openConfirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      setState({
        ...options,
        resolve,
      });
    });
  }, []);

  React.useEffect(() => {
    if (state) {
      confirmRef.current?.focus({ preventScroll: true });
    }
  }, [state]);

  React.useEffect(() => {
    setConfirmImpl(openConfirm);
    return () => {
      setConfirmImpl(() => Promise.resolve(false));
    };
  }, [openConfirm]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog(false);
    }
  };

  const variant = state?.variant ?? 'default';
  const confirmText = state?.confirmText ?? (variant === 'destructive' ? 'Delete' : 'Confirm');
  const cancelText = state?.cancelText ?? 'Cancel';

  return (
    <ConfirmContext.Provider value={{ openConfirm }}>
      {children}
      <AlertDialog open={Boolean(state)} onOpenChange={handleOpenChange}>
        <AlertDialogContent
          role='alertdialog'
          aria-live='assertive'
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !('isComposing' in event && event.isComposing)) {
              event.preventDefault();
              closeDialog(true);
            }
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              closeDialog(true);
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{state?.title}</AlertDialogTitle>
              {state?.description ? <AlertDialogDescription>{state.description}</AlertDialogDescription> : null}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button ref={cancelRef} type='button' variant='outline' onClick={() => closeDialog(false)}>
                  {cancelText}
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  ref={confirmRef}
                  type='submit'
                  variant={variant === 'destructive' ? 'destructive' : 'default'}
                  className={cn(variant === 'destructive' ? 'focus:ring-destructive' : undefined)}
                >
                  {confirmText}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};
