import { notify } from '@/lib/toast';

export type UndoToastOptions = {
  title: string;
  description?: string;
  undoLabel?: string;
  durationMs?: number;
  toastId?: string;
  onUndo?: () => void;
  onCommit?: () => void;
};

export type UndoToastHandle = {
  cancel: () => void;
  finalize: () => void;
};

const DEFAULT_DURATION = 10_000;

export const showUndoToast = (options: UndoToastOptions): UndoToastHandle => {
  const duration = options.durationMs ?? DEFAULT_DURATION;
  let settled = false;

  const clear = () => {
    settled = true;
  };

  const finalize = () => {
    if (settled) return;
    clearTimeout(timer);
    clear();
    options.onCommit?.();
  };

  const cancel = () => {
    if (settled) return;
    clearTimeout(timer);
    clear();
    options.onUndo?.();
  };

  const timer = window.setTimeout(() => {
    if (!settled) {
      finalize();
    }
  }, duration);

  notify.success({
    title: options.title,
    description:
      options.description ?? `Undo available for ${Math.round(duration / 1000)} seconds.`,
    key: options.toastId,
    duration,
    undo: {
      label: options.undoLabel ?? 'Undo',
      onClick: cancel,
    },
  });

  return {
    cancel,
    finalize,
  };
};
