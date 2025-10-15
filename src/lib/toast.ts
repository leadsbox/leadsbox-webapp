import { toast } from 'sonner';
import { CACHE_KEYS } from '@/api/config';

type Severity = 'success' | 'info' | 'warning' | 'error';

type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  title: string;
  description?: string;
  key?: string;
  action?: ToastAction;
  undo?: ToastAction;
  duration?: number;
  silent?: boolean;
  data?: Record<string, unknown>;
};

const DEFAULT_DURATIONS: Record<Severity, number> = {
  success: 3000,
  info: 3600,
  warning: 4000,
  error: 6500,
};

const DEDUPE_WINDOW = 4000;
const ERROR_RATE_LIMIT_WINDOW = 12000;
const DESCRIPTION_LIMIT = 80;

type ActiveToast = {
  id: string;
  count: number;
  lastShown: number;
  severity: Severity;
};

const activeToasts = new Map<string, ActiveToast>();

const severityToFn: Record<Severity, (title: string, options: Parameters<typeof toast>[1]) => string | number> = {
  success: (title, options) => toast.success(title, options),
  info: (title, options) => toast(title, options),
  warning: (title, options) => toast.warning(title, options),
  error: (title, options) => toast.error(title, options),
};

const sanitize = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const masked = trimmed.replace(/[0-9A-Za-z]{6,}/g, '***');
  return masked.length > DESCRIPTION_LIMIT
    ? `${masked.slice(0, DESCRIPTION_LIMIT - 1)}…`
    : masked;
};

const analyticsEvent = (
  severity: Severity,
  key: string,
  count: number,
  meta?: Record<string, unknown>
) => {
  try {
    const tenantId = localStorage.getItem(CACHE_KEYS.organization);
    const detail = {
      type: severity,
      key,
      count,
      tenant_id: tenantId,
      ...meta,
    };
    window.dispatchEvent(new CustomEvent('lb:toast-shown', { detail }));
  } catch (error) {
    console.debug('toast analytics dispatch failed', error);
  }
};

const resolveAction = (action?: ToastAction, undo?: ToastAction): ToastAction | undefined => {
  if (undo) {
    return {
      label: undo.label ?? 'Undo',
      onClick: undo.onClick,
    };
  }
  return action;
};

const show = (severity: Severity, options: ToastOptions) => {
  if (!options.title || options.silent) {
    return undefined;
  }

  const key = options.key ?? `${severity}:${options.title}:${options.description ?? ''}`;
  const now = Date.now();
  const existing = activeToasts.get(key);
  const windowMs = severity === 'error' ? ERROR_RATE_LIMIT_WINDOW : DEDUPE_WINDOW;

  let count = 1;
  if (existing && now - existing.lastShown < windowMs) {
    count = existing.count + 1;
    activeToasts.set(key, {
      ...existing,
      count,
      lastShown: now,
    });
  } else {
    activeToasts.set(key, {
      id: key,
      count,
      severity,
      lastShown: now,
    });
  }

  if (severity === 'error' && existing && count > 1 && now - existing.lastShown < 1500) {
    // throttle tight error loops by not re-rendering instantly
    return key;
  }

  const titleWithCount = count > 1 ? `${options.title} ×${count}` : options.title;
  const description = sanitize(options.description);
  const action = resolveAction(options.action, options.undo);

  const toastOptions = {
    id: key,
    description,
    duration: options.duration ?? DEFAULT_DURATIONS[severity],
    dismissible: true,
    action: action
      ? {
          label: action.label,
          onClick: () => {
            activeToasts.delete(key);
            action.onClick();
          },
        }
      : undefined,
    onDismiss: () => {
      activeToasts.delete(key);
    },
  } satisfies Parameters<typeof toast>[1];

  const render = severityToFn[severity];
  render(titleWithCount, toastOptions);
  analyticsEvent(severity, key, count, options.data);

  return key;
};

type PromiseMessages<T> = {
  loading: ToastOptions;
  success: ((value: T) => ToastOptions) | ToastOptions;
  error: ((error: unknown) => ToastOptions) | ToastOptions;
  key?: string;
};

const toToastOptions = <T,>(
  input: ToastOptions | ((value: T) => ToastOptions),
  payload: T
): ToastOptions => {
  if (typeof input === 'function') {
    return input(payload);
  }
  return input;
};

const promise = async <T,>(task: Promise<T>, messages: PromiseMessages<T>) => {
  const key =
    messages.key ??
    messages.loading.key ??
    `promise:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`;

  show('info', {
    ...messages.loading,
    key,
    duration: Infinity,
  });

  try {
    const result = await task;
    show('success', {
      ...toToastOptions(messages.success, result),
      key,
    });
    return result;
  } catch (error) {
    show('error', {
      ...toToastOptions(messages.error, error),
      key,
    });
    throw error;
  }
};

export const notify = {
  success: (options: ToastOptions) => show('success', options),
  info: (options: ToastOptions) => show('info', options),
  warning: (options: ToastOptions) => show('warning', options),
  error: (options: ToastOptions) => show('error', options),
  promise,
};
