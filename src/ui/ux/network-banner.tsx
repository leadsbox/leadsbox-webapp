import React from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { NetworkBannerPayload, NetworkBannerVariant, publishNetworkBanner, subscribeToNetworkBanner } from './utils';

type NetworkStatusContextValue = {
  activeBanner: NetworkBannerPayload | null;
  banners: NetworkBannerPayload[];
  showBanner: (banner: NetworkBannerPayload) => void;
  dismissBanner: (id: string) => void;
  clearSource: (source: string) => void;
  isOnline: boolean;
};

const NetworkStatusContext = React.createContext<NetworkStatusContextValue | undefined>(undefined);

const variantPriority: Record<NetworkBannerVariant, number> = {
  error: 3,
  warning: 2,
  info: 1,
};

const variantStyles: Record<NetworkBannerVariant, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

const toArray = (input: Map<string, NetworkBannerPayload>) =>
  Array.from(input.values()).sort((a, b) => variantPriority[b.variant] - variantPriority[a.variant]);

export const NetworkBannerProvider = ({ children }: { children: React.ReactNode }) => {
  const [bannerMap, setBannerMap] = React.useState<Map<string, NetworkBannerPayload>>(new Map());
  const [isOnline, setIsOnline] = React.useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const timers = React.useRef<Map<string, number>>(new Map());
  const wasOfflineRef = React.useRef<boolean>(false);
  const reconnectedBannerId = React.useRef<string>('network-reconnected');

  const dismissBanner = React.useCallback((id: string) => {
    setBannerMap((current) => {
      if (!current.has(id)) {
        return current;
      }
      const next = new Map(current);
      next.delete(id);
      return next;
    });
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showBanner = React.useCallback(
    (banner: NetworkBannerPayload) => {
      setBannerMap((current) => {
        const next = new Map(current);
        next.set(banner.id, banner);
        return next;
      });

      if (banner.autoHideMs) {
        const existing = timers.current.get(banner.id);
        if (existing) {
          window.clearTimeout(existing);
        }
        const handle = window.setTimeout(() => dismissBanner(banner.id), banner.autoHideMs);
        timers.current.set(banner.id, handle);
      }
    },
    [dismissBanner]
  );

  const clearSource = React.useCallback((source: string) => {
    setBannerMap((current) => {
      const next = new Map(current);
      current.forEach((banner, id) => {
        if (banner.source === source) {
          next.delete(id);
          const timer = timers.current.get(id);
          if (timer) {
            window.clearTimeout(timer);
            timers.current.delete(id);
          }
        }
      });
      return next;
    });
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeToNetworkBanner((event) => {
      if (event.type === 'show') {
        showBanner(event.banner);
      } else if (event.type === 'dismiss') {
        dismissBanner(event.id);
      } else if (event.type === 'clear-source') {
        clearSource(event.source);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dismissBanner, showBanner, clearSource]);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        showBanner({
          id: reconnectedBannerId.current,
          title: 'Connection restored',
          description: 'You’re back online. Latest updates are syncing.',
          variant: 'info',
          autoHideMs: 6000,
          source: 'network-status',
        });
        wasOfflineRef.current = false;
      }
    };
    const handleOffline = () => {
      wasOfflineRef.current = true;
      dismissBanner(reconnectedBannerId.current);
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dismissBanner, showBanner]);

  React.useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    []
  );

  const banners = React.useMemo(() => toArray(bannerMap), [bannerMap]);
  const activeBanner = banners[0] ?? null;

  const value = React.useMemo(
    () => ({
      activeBanner,
      banners,
      showBanner,
      dismissBanner,
      clearSource,
      isOnline,
    }),
    [activeBanner, banners, showBanner, dismissBanner, clearSource, isOnline]
  );

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
};

const useNetworkStatus = () => {
  const context = React.useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within NetworkBannerProvider');
  }
  return context;
};

const getLiveRegionMode = (variant: NetworkBannerVariant) => {
  if (variant === 'error') return 'assertive';
  return 'polite';
};

export const NetworkBannerSurface = ({ className }: { className?: string }) => {
  const { activeBanner, dismissBanner } = useNetworkStatus();

  if (!activeBanner) {
    return null;
  }

  const { id, title, description, variant, action, dismissible = true } = activeBanner;

  return (
    <div
      key={id}
      role='status'
      aria-live={getLiveRegionMode(variant)}
      className={cn(
        'pointer-events-auto flex w-full items-center justify-between gap-4 border px-4 py-3 text-sm shadow-sm',
        'rounded-none md:rounded-md',
        variantStyles[variant],
        className
      )}
      data-variant={variant}
    >
      <div className='flex flex-1 flex-col gap-1'>
        <span className='font-medium'>{title}</span>
        {description ? <span className='text-sm opacity-80'>{description}</span> : null}
      </div>
      {action ? (
        action.href ? (
          <Button asChild size='sm' variant='outline'>
            <a href={action.href} className='whitespace-nowrap'>
              {action.label}
            </a>
          </Button>
        ) : (
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              action.onClick?.();
              dismissBanner(id);
            }}
          >
            {action.label}
          </Button>
        )
      ) : null}
      {dismissible ? (
        <button
          type='button'
          onClick={() => dismissBanner(id)}
          aria-label='Dismiss banner'
          className='rounded-full p-1 text-current/70 transition hover:bg-black/10 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
        >
          <X className='h-4 w-4' aria-hidden />
        </button>
      ) : null}
    </div>
  );
};
