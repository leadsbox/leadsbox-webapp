// Combined UX utilities for confirm dialogs and network banners

// === CONFIRM DIALOG UTILITIES ===

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
};

let confirmImpl: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  if (!confirmImpl) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('confirm called outside of provider');
    }
    return Promise.resolve(false);
  }
  return confirmImpl(options);
};

export const setConfirmImpl = (impl: (options: ConfirmOptions) => Promise<boolean>) => {
  confirmImpl = impl;
};

// Hook that returns the confirm function
export const useConfirm = (): ((options: ConfirmOptions) => Promise<boolean>) => {
  return confirm;
};

// === NETWORK BANNER UTILITIES ===

export type NetworkBannerVariant = 'info' | 'warning' | 'error';

export type NetworkBannerAction = {
  label: string;
  onClick?: () => void;
  href?: string;
};

export type NetworkBannerPayload = {
  id: string;
  title: string;
  description?: string;
  variant: NetworkBannerVariant;
  action?: NetworkBannerAction;
  dismissible?: boolean;
  autoHideMs?: number;
  source?: string;
};

export type NetworkBannerEvent =
  | { type: 'show'; banner: NetworkBannerPayload }
  | { type: 'dismiss'; id: string }
  | { type: 'clear-source'; source: string };

type NetworkBannerListener = (event: NetworkBannerEvent) => void;

const networkListeners: NetworkBannerListener[] = [];

export const publishNetworkBanner = (event: NetworkBannerEvent): void => {
  networkListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in network banner listener:', error);
    }
  });
};

export const subscribeToNetworkBanner = (listener: NetworkBannerListener): (() => void) => {
  networkListeners.push(listener);
  return () => {
    const index = networkListeners.indexOf(listener);
    if (index > -1) {
      networkListeners.splice(index, 1);
    }
  };
};

// Convenient function to emit network banners
export const emitNetworkBanner = publishNetworkBanner;

// === HELPER FUNCTIONS ===

export const showNetworkBanner = (banner: NetworkBannerPayload) => {
  publishNetworkBanner({ type: 'show', banner });
};

export const dismissNetworkBanner = (id: string) => {
  publishNetworkBanner({ type: 'dismiss', id });
};

export const clearNetworkBannerSource = (source: string) => {
  publishNetworkBanner({ type: 'clear-source', source });
};
