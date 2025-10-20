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
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
};

type ConfirmState = ConfirmOptions | null;

type ConfirmContextValue = {
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = React.createContext<ConfirmContextValue | undefined>(undefined);

type ProviderProps = {
  children: React.ReactNode;
};

let confirmImpl: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  if (!confirmImpl) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('confirm called without provider');
    }
    return Promise.resolve(false);
  }
  return confirmImpl(options);
};

export const ConfirmProvider = ({ children }: ProviderProps) => {
  const [state, setState] = React.useState<ConfirmState>(null);
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const confirmRef = React.useRef<HTMLButtonElement | null>(null);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);
  const skipNextCloseRef = React.useRef(false);

  const restoreFocus = React.useCallback(() => {
    const target = lastFocusedRef.current;
    window.requestAnimationFrame(() => {
      target?.focus?.({ preventScroll: true });
      lastFocusedRef.current = null;
    });
  }, []);

  const closeDialog = React.useCallback(
    (confirmed: boolean) => {
      const resolver = resolverRef.current;
      if (resolver) {
        resolver(confirmed);
        resolverRef.current = null;
      }
      setState(null);
      restoreFocus();
    },
    [restoreFocus]
  );

  const closeDialogConfirmed = React.useCallback(() => {
    skipNextCloseRef.current = true;
    closeDialog(true);
  }, [closeDialog]);

  const openConfirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      if (typeof document !== 'undefined') {
        const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        lastFocusedRef.current = activeElement;
        activeElement?.blur();
      } else {
        lastFocusedRef.current = null;
      }
      resolverRef.current = resolve;
      setState(options);
    });
  }, []);

  React.useEffect(() => {
    if (state) {
      confirmRef.current?.focus({ preventScroll: true });
    }
  }, [state]);

  React.useEffect(() => {
    confirmImpl = openConfirm;
    return () => {
      confirmImpl = null;
    };
  }, [openConfirm]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (skipNextCloseRef.current) {
        skipNextCloseRef.current = false;
        return;
      }
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
              closeDialogConfirmed();
            }
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            skipNextCloseRef.current = false;
            closeDialog(false);
          }}
          onPointerDownOutside={(event) => {
            // Radix passes detail.originalEvent; prevent closing when inner buttons clicked
            if (event?.defaultPrevented) return;
            skipNextCloseRef.current = false;
            closeDialog(false);
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.title}</AlertDialogTitle>
            {state?.description ? <AlertDialogDescription>{state.description}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                ref={cancelRef}
                type='button'
                variant='outline'
                onClick={() => {
                  skipNextCloseRef.current = false;
                  closeDialog(false);
                }}
              >
                {cancelText}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction
              ref={confirmRef}
              type='button'
              className={cn(
                buttonVariants({ variant: variant === 'destructive' ? 'destructive' : 'default' }),
                variant === 'destructive' ? 'bg-red-700 hover:bg-red-800 focus-visible:ring-destructive' : undefined
              )}
              onClick={closeDialogConfirmed}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.openConfirm;
};
