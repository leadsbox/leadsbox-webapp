// Dashboard Layout Component for LeadsBox

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  ShoppingBag,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  Inbox,
  Calendar,
  FileText,
  Sparkles,
  Home,
  CreditCard,
  Loader2,
  Package,
  BookOpen,
  BellRing,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import DashboardHeader from './DashboardHeader';
import SupportWidget from './SupportWidget';
import { FeedbackDialog } from './FeedbackDialog';
import { OfflineBanner } from './OfflineBanner';
import { ConnectionStatus } from './ConnectionStatus';
import client from '../api/client';
import { endpoints } from '../api/config';
import { useSubscription } from '@/context/SubscriptionContext';
import { useSocketIO } from '../lib/socket';
import { Message } from '@/types';
import { trackAppEvent, trackMobileBlocked } from '@/lib/productTelemetry';
import { notify } from '@/lib/toast';
import { subscribeApiMonitoringAlerts } from '@/lib/apiMonitoring';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Home',
    href: '/dashboard/home',
    icon: Home,
    description: 'Command center overview',
  },
  {
    title: 'Setup',
    href: '/dashboard/setup',
    icon: Sparkles,
    description: 'Launch checklist and first-value steps',
  },
  {
    title: 'Inbox',
    href: '/dashboard/inbox',
    icon: Inbox,
    description: 'Messages and conversations',
  },
  {
    title: 'Leads',
    href: '/dashboard/leads',
    icon: Users,
    description: 'Manage your leads',
  },
  {
    title: 'Sales',
    href: '/dashboard/sales',
    icon: ShoppingBag,
    description: 'Sales grouped from conversations',
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    icon: Package,
    description: 'Manage your product catalog',
  },
  {
    title: 'Catalogs',
    href: '/dashboard/catalogs',
    icon: BookOpen,
    description: 'Product collections and sharing',
  },
  {
    title: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
    description: 'Create and manage invoices',
  },

  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Performance metrics',
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Plans, subscriptions, payments',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
  // {
  //   title: 'Templates',
  //   href: '/dashboard/templates',
  //   icon: MessageSquare,
  //   description: 'WhatsApp message templates',
  // },
  // {
  //   title: 'Tasks',
  //   href: '/dashboard/tasks',
  //   icon: CheckSquare,
  //   badge: 3,
  //   description: 'Your tasks and reminders',
  // },

  // 🚀 LAUNCH MVP: Hiding non-essential features (can re-enable by uncommenting)
  // {
  //   title: 'Automations',
  //   href: '/dashboard/automations',
  //   icon: Sparkles,
  //   description: 'Follow-ups & workflow builder',
  // },
  // {
  //   title: 'Carousel',
  //   href: '/dashboard/carousel',
  //   icon: Sparkles,
  //   description: 'Generate branded carousels from videos',
  // },

  // {
  //   title: 'Quotes',
  //   href: '/dashboard/quotes',
  //   icon: FileSpreadsheet,
  //   description: 'Create and send quotes',
  // },
];

const DashboardContentFallback = () => (
  <div className='flex min-h-[320px] items-center justify-center text-muted-foreground' role='status' aria-live='polite'>
    <Loader2 className='h-6 w-6 animate-spin text-primary' />
    <span className='sr-only'>Loading dashboard content…</span>
  </div>
);

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lb_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false));
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [salesAiCount, setSalesAiCount] = useState<number>(0);
  const [productsAiCount, setProductsAiCount] = useState<number>(0);
  const [catalogsAiCount, setCatalogsAiCount] = useState<number>(0);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'default',
    );
  const { subscription, loading: subscriptionLoading, trialDaysRemaining, trialEndsAt } = useSubscription();
  const { socket } = useSocketIO();

  const fetchAiSidebarCounts = useCallback(async () => {
    try {
      const [salesPendingRes, productsPendingRes, catalogsRes] = await Promise.all([
        client.get(endpoints.sales.pendingCount),
        client.get('/products/pending'),
        client.get('/catalogs'),
      ]);

      const pendingSalesCount = Number(salesPendingRes?.data?.data?.count ?? 0);
      const pendingProducts = productsPendingRes?.data?.data?.products ?? [];
      const catalogs = catalogsRes?.data?.data?.catalogs ?? [];

      const pendingProductsCount = Array.isArray(pendingProducts)
        ? pendingProducts.length
        : 0;
      const aiCatalogsCount = Array.isArray(catalogs)
        ? catalogs.filter((catalog: any) =>
            Array.isArray(catalog?.items) &&
            catalog.items.some(
              (item: any) =>
                item?.product?.isAutoDetected === true &&
                item?.product?.status === 'PENDING',
            ),
          ).length
        : 0;

      setSalesAiCount(pendingSalesCount);
      setProductsAiCount(pendingProductsCount);
      setCatalogsAiCount(aiCatalogsCount);
    } catch (error) {
      console.error('Failed to fetch AI sidebar counts:', error);
      setSalesAiCount(0);
      setProductsAiCount(0);
      setCatalogsAiCount(0);
    }
  }, []);
  const opsAlertRef = useRef<{
    initialized: boolean;
    pendingAiReviews: number;
    dueFollowUps: number;
    pendingPayments: number;
  }>({
    initialized: false,
    pendingAiReviews: 0,
    dueFollowUps: 0,
    pendingPayments: 0,
  });

  // Fetch actual inbox count
  useEffect(() => {
    const fetchInboxCount = async () => {
      try {
        setInboxLoading(true);
        // Fetch unread count specifically
        const resp = await client.get('/threads/unread-count');
        const count = resp.data?.data?.count ?? 0;
        setInboxCount(count);
      } catch (error) {
        console.error('Failed to fetch inbox count:', error);
        setInboxCount(0);
      } finally {
        setInboxLoading(false);
      }
    };

    fetchInboxCount();
  }, []);

  useEffect(() => {
    let active = true;

    const refreshCounts = async () => {
      if (!active) return;
      await fetchAiSidebarCounts();
    };

    void refreshCounts();
    const interval = window.setInterval(refreshCounts, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [fetchAiSidebarCounts]);

  // Listen for real-time updates to inbox count
  useEffect(() => {
    if (!socket) return;

    const handleMessageNew = (data: { message: Message }) => {
      // If new inbound message, increment count
      if (data?.message?.sender === 'LEAD') {
        setInboxCount((prev) => prev + 1);

        if (
          typeof window !== 'undefined' &&
          document.hidden &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          const title = 'New message in LeadsBox';
          const body =
            data?.message?.content?.slice(0, 120) ||
            'You have a new inbound message.';

          if ('serviceWorker' in navigator) {
            void navigator.serviceWorker
              .getRegistration()
              .then((registration) => {
                if (registration) {
                  return registration.showNotification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: `message-${data.message.id}`,
                    data: { url: '/dashboard/inbox' },
                  });
                }

                new Notification(title, { body, icon: '/favicon.ico' });
              })
              .catch(() => {
                new Notification(title, { body, icon: '/favicon.ico' });
              });
          } else {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        }
      }
    };

    const handleRefresh = () => {
      // Refresh count on thread updates (e.g. read status changes)
      client
        .get('/threads/unread-count')
        .then((resp) => setInboxCount(resp.data?.data?.count ?? 0))
        .catch(console.error);
    };

    const handleNlpSmall = () => {
      void fetchAiSidebarCounts();
    };

    socket.on('message:new', handleMessageNew);
    socket.on('thread:updated', handleRefresh);
    socket.on('thread:read', handleRefresh); // Just in case backend emits this
    socket.on('nlp:small', handleNlpSmall);

    // Listen for custom event from InboxPage
    const handleLocalRead = () => handleRefresh();
    window.addEventListener('leadsbox:thread-read', handleLocalRead);

    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('thread:updated', handleRefresh);
      socket.off('thread:read', handleRefresh);
      socket.off('nlp:small', handleNlpSmall);
      window.removeEventListener('leadsbox:thread-read', handleLocalRead);
    };
  }, [socket, fetchAiSidebarCounts]);

  useEffect(() => {
    let active = true;

    const fetchOpsAlerts = async () => {
      try {
        const [reviewRes, followUpsRes, pendingSalesRes] = await Promise.all([
          client.get(endpoints.sales.reviewInbox, { params: { limit: 1 } }),
          client.get(endpoints.followups, { params: { status: 'SCHEDULED' } }),
          client.get(endpoints.sales.list, { params: { status: 'PENDING' } }),
        ]);

        const pendingAiReviews = Number(reviewRes?.data?.data?.summary?.pendingCount || 0);
        const followUps = followUpsRes?.data?.data?.followUps || followUpsRes?.data?.followUps || [];
        const dueFollowUps = Array.isArray(followUps)
          ? followUps.filter((followUp) => {
              const scheduled = new Date((followUp as { scheduledTime?: string }).scheduledTime || '');
              return Number.isFinite(scheduled.getTime()) && scheduled.getTime() <= Date.now();
            }).length
          : 0;
        const pendingPayments = Number((pendingSalesRes?.data?.data?.sales || pendingSalesRes?.data?.sales || []).length || 0);

        if (!active) {
          return;
        }

        const previous = opsAlertRef.current;
        const countsChanged =
          !previous.initialized ||
          pendingAiReviews !== previous.pendingAiReviews ||
          dueFollowUps !== previous.dueFollowUps ||
          pendingPayments !== previous.pendingPayments;

        if (previous.initialized) {
          if (pendingAiReviews > previous.pendingAiReviews) {
            notify.info({
              key: 'ops:pending-ai-reviews',
              title: 'AI decisions need review',
              description: `${pendingAiReviews} sales are waiting for approval.`,
              action: {
                label: 'Review',
                onClick: () => navigate('/dashboard/sales'),
              },
            });
          }

          if (dueFollowUps > previous.dueFollowUps) {
            notify.info({
              key: 'ops:due-followups',
              title: 'Follow-ups are due',
              description: `${dueFollowUps} scheduled follow-ups are ready to send.`,
              action: {
                label: 'Open inbox',
                onClick: () => navigate('/dashboard/inbox'),
              },
            });
          }

          if (pendingPayments > previous.pendingPayments) {
            notify.info({
              key: 'ops:pending-payments',
              title: 'Payments pending',
              description: `${pendingPayments} sales are awaiting payment confirmation.`,
              action: {
                label: 'Open sales',
                onClick: () => navigate('/dashboard/sales'),
              },
            });
          }
        }

        opsAlertRef.current = {
          initialized: true,
          pendingAiReviews,
          dueFollowUps,
          pendingPayments,
        };

        if (countsChanged) {
          trackAppEvent('ops_alert_snapshot', {
            pendingAiReviews,
            dueFollowUps,
            pendingPayments,
          });
        }
      } catch {
        // Non-blocking polling path.
      }
    };

    void fetchOpsAlerts();
    const interval = window.setInterval(fetchOpsAlerts, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [navigate]);

  useEffect(() => {
    return subscribeApiMonitoringAlerts((alert) => {
      const title = alert.title;
      const description = alert.description;
      if (alert.severity === 'error') {
        notify.error({
          key: `api-monitoring:${alert.flow}:${alert.reason}`,
          title,
          description,
        });
      } else {
        notify.warning({
          key: `api-monitoring:${alert.flow}:${alert.reason}`,
          title,
          description,
        });
      }
    });
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
      trackAppEvent('pwa_install_prompt_available');
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      trackAppEvent('pwa_install_prompt_choice', { outcome: choice.outcome });
      if (
        choice.outcome === 'dismissed' &&
        window.matchMedia('(max-width: 768px)').matches
      ) {
        trackMobileBlocked('pwa_install', 'dismissed_prompt');
      }
    } finally {
      setDeferredInstallPrompt(null);
    }
  };

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    trackAppEvent('notification_permission_result', {
      permission: result,
    });
    if (
      result !== 'granted' &&
      window.matchMedia('(max-width: 768px)').matches
    ) {
      trackMobileBlocked('push_notifications', 'permission_not_granted', {
        permission: result,
      });
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const sidebarWidth = useMemo(() => (sidebarCollapsed ? 'w-16' : 'w-64'), [sidebarCollapsed]);
  const getSidebarDynamicCount = useCallback((title: string): number => {
    switch (title) {
      case 'Inbox':
        return inboxCount;
      case 'Sales':
        return salesAiCount;
      case 'Products':
        return productsAiCount;
      case 'Catalogs':
        return catalogsAiCount;
      default:
        return 0;
    }
  }, [catalogsAiCount, inboxCount, productsAiCount, salesAiCount]);
  const formattedRenewal = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const bannerTitle =
    subscription?.status === 'ACTIVE' && subscription?.plan?.name ? `${subscription.plan.name} plan active` : 'Manage your leads efficiently';
  const bannerSubtitle = subscriptionLoading
    ? 'Checking subscription status…'
    : subscription?.status === 'ACTIVE'
      ? formattedRenewal
        ? `Renews ${formattedRenewal}`
        : 'Thanks for being part of LeadsBox!'
      : trialDaysRemaining > 0
        ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in trial`
        : 'Trial ended — choose a plan to stay connected.';
  const collapsedSubtitle = subscription?.status === 'ACTIVE' && subscription?.plan?.name ? subscription.plan.name : bannerSubtitle;
  const handleGoToBilling = () => navigate('/dashboard/billing');
  const billingButtonText = subscription?.status === 'ACTIVE' ? 'Manage billing' : 'View payment plans';

  return (
    <div className='dashboard-container flex h-screen overflow-hidden'>
      <OfflineBanner />
      <ConnectionStatus />
      {/* Desktop Sidebar */}
      <aside
        className={cn('dashboard-sidebar hidden md:flex flex-col transition-[width] duration-300 ease-in-out', sidebarWidth)}
        aria-label='Sidebar'
      >
        {/* Sidebar header */}
        <div className='flex h-16 items-center justify-between px-4 border-b border-border'>
          {!sidebarCollapsed && (
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
                <img
                  src='/leadsboxlogo.svg'
                  alt='LeadsBox Logo'
                  width={24}
                  height={24}
                  className='w-full h-full object-contain'
                  decoding='async'
                  loading='lazy'
                />
              </div>
              <span className='font-semibold text-sidebar-foreground'>LeadsBox</span>
            </div>
          )}

          <Button
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
            className='h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent'
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={sidebarCollapsed}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 overflow-auto py-4'>
          <div className='space-y-1'>
            {(sidebarItems || []).map((item) => {
              const isActive = location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'sidebar-item-base',
                    sidebarCollapsed ? 'sidebar-item-collapsed' : '',
                    isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <motion.div
                    className={cn('flex items-center', sidebarCollapsed ? 'justify-center' : 'w-full')}
                    whileHover={{ x: isActive || sidebarCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0 transition-colors', isActive ? 'text-primary' : 'text-sidebar-foreground/60')} />

                    {!sidebarCollapsed && (
                      <>
                        <span className='ml-3 flex-1'>{item.title}</span>
                        {getSidebarDynamicCount(item.title) > 0 && (
                          <Badge variant='destructive' className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
                            {item.title === 'Inbox' && inboxLoading ? '...' : getSidebarDynamicCount(item.title)}
                          </Badge>
                        )}
                        {item.title === 'Tasks' && item.badge && (
                          <Badge variant='destructive' className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}

                    {sidebarCollapsed && getSidebarDynamicCount(item.title) > 0 && (
                      <Badge variant='destructive' className='absolute top-1 right-1 h-4 w-4 flex items-center justify-center text-xs p-0'>
                        {item.title === 'Inbox' && inboxLoading ? '...' : getSidebarDynamicCount(item.title)}
                      </Badge>
                    )}
                    {sidebarCollapsed && item.title === 'Tasks' && item.badge && (
                      <Badge variant='destructive' className='absolute top-1 right-1 h-4 w-4 flex items-center justify-center text-xs p-0'>
                        {item.badge}
                      </Badge>
                    )}
                  </motion.div>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className='border-t border-border p-4 space-y-2'>
          {sidebarCollapsed ? (
            <motion.div whileHover={{ scale: 1.05 }} className='flex flex-col items-center gap-2 text-xs text-sidebar-foreground/70'>
              {/* Show only an icon button when collapsed to avoid any text */}
              <Button
                variant='ghost'
                size='icon'
                onClick={handleGoToBilling}
                className='h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent'
                aria-label={billingButtonText}
                title={billingButtonText}
              >
                <CreditCard className='h-5 w-5 text-primary' />
              </Button>
            </motion.div>
          ) : (
            <div className='rounded-lg bg-primary/10 p-4 text-xs text-sidebar-foreground'>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <div className='font-semibold text-sm text-primary'>{bannerTitle}</div>
                  <div className='text-sidebar-foreground/70 mt-1'>{bannerSubtitle}</div>
                </div>
                <CreditCard className='h-6 w-6 text-primary flex-shrink-0' />
              </div>
              <Button size='sm' className='mt-3 w-full' onClick={handleGoToBilling}>
                {billingButtonText}
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={cn('md:hidden fixed inset-0 z-40', mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')}
        aria-hidden={!mobileOpen}
        id='mobile-sidebar'
      >
        {/* Backdrop */}
        <div
          className={cn('absolute inset-0 bg-black/40 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer */}
        <aside
          className={cn(
            'dashboard-sidebar absolute inset-y-0 left-0 w-64 shadow-2xl',
            'transition-transform duration-300 ease-in-out will-change-transform',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          role='dialog'
          aria-modal='true'
          aria-label='Mobile Sidebar'
        >
          {/* Sidebar header */}
          <div className='flex h-16 items-center justify-between px-4 border-b border-border'>
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
                <img
                  src='/leadsboxlogo.svg'
                  alt='LeadsBox Logo'
                  width={24}
                  height={24}
                  className='w-full h-full object-contain'
                  decoding='async'
                  loading='lazy'
                />
              </div>
              <span className='font-semibold text-sidebar-foreground'>LeadsBox</span>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setMobileOpen(false)}
              className='h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent'
              aria-label='Close menu'
            >
              <ChevronLeft className='h-4 w-4 rotate-180' />
            </Button>
          </div>
          {/* Navigation */}
          <nav className='flex-1 overflow-auto py-4'>
            <div className='space-y-1 px-3'>
              {(sidebarItems || []).map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={cn('sidebar-item-base px-3', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')}
                  >
                    <motion.div
                      className='flex items-center w-full'
                      whileHover={{ x: isActive ? 0 : 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <item.icon
                        className={cn('h-5 w-5 flex-shrink-0 transition-colors', isActive ? 'text-primary' : 'text-sidebar-foreground/60')}
                      />
                      <span className='ml-3 flex-1'>{item.title}</span>
                      {getSidebarDynamicCount(item.title) > 0 && (
                        <Badge variant='destructive' className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
                          {item.title === 'Inbox' && inboxLoading ? '...' : getSidebarDynamicCount(item.title)}
                        </Badge>
                      )}
                      {item.badge && getSidebarDynamicCount(item.title) === 0 && (
                        <Badge variant={isActive ? 'secondary' : 'outline'} className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
                          {item.badge}
                        </Badge>
                      )}
                    </motion.div>
                  </NavLink>
                );
              })}
            </div>
          </nav>
          {/* Sidebar footer */}
          <div className='border-t border-border p-4 space-y-2'>
            <div className='rounded-lg bg-primary/10 p-4 text-xs text-sidebar-foreground'>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <div className='font-semibold text-sm text-primary'>{bannerTitle}</div>
                  <div className='text-sidebar-foreground/70 mt-1'>{bannerSubtitle}</div>
                </div>
                <CreditCard className='h-6 w-6 text-primary flex-shrink-0' />
              </div>
              <Button size='sm' className='mt-3 w-full' onClick={handleGoToBilling}>
                {billingButtonText}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main content area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {(deferredInstallPrompt || notificationPermission !== 'granted') && (
          <div className='border-b bg-muted/40 px-4 py-2'>
            <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-sm'>
              <p className='text-muted-foreground'>
                Install LeadsBox and enable alerts for faster mobile response.
              </p>
              <div className='flex flex-wrap gap-2'>
                {deferredInstallPrompt && (
                  <Button size='sm' variant='outline' onClick={handleInstallApp}>
                    <Download className='mr-1 h-4 w-4' />
                    Install app
                  </Button>
                )}
                {notificationPermission !== 'granted' && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleEnableNotifications}
                  >
                    <BellRing className='mr-1 h-4 w-4' />
                    Enable alerts
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <DashboardHeader onSidebarToggle={toggleSidebar} sidebarOpen={isMobile ? mobileOpen : !sidebarCollapsed} />

        {/* Page content */}
        <section className='dashboard-main flex-1 overflow-auto' aria-label='Dashboard content'>
          <Suspense fallback={<DashboardContentFallback />}>
            <Outlet />
          </Suspense>
        </section>
      </div>
      <SupportWidget />
      <FeedbackDialog />
    </div>
  );
};

export default DashboardLayout;
