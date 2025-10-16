export type NetworkBannerVariant = 'info' | 'warning' | 'error';

export type NetworkBannerAction = {
  label: string;
  href?: string;
  onClick?: () => void;
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

type Listener = (event: NetworkBannerEvent) => void;

const listeners = new Set<Listener>();

export const subscribeToNetworkBanner = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const publishNetworkBanner = (event: NetworkBannerEvent) => {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error('network banner listener failed', error);
    }
  });
};

export const dismissNetworkBanner = (id: string) =>
  publishNetworkBanner({ type: 'dismiss', id });

export const clearBannerSource = (source: string) =>
  publishNetworkBanner({ type: 'clear-source', source });
