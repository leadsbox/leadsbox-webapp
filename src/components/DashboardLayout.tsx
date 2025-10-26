// Dashboard Layout Component for LeadsBox

import React, { Suspense, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import DashboardHeader from './DashboardHeader';
import client from '../api/client';
import { endpoints } from '../api/config';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: number;
}

interface SubscriptionSummary {
  id: string;
  status: string;
  plan?: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
  } | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Home',
    href: '/dashboard/home',
    icon: Home,
    description: 'Command center overview',
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
    title: 'Templates',
    href: '/dashboard/templates',
    icon: MessageSquare,
    description: 'WhatsApp message templates',
  },
  {
    title: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    badge: 3,
    description: 'Your tasks and reminders',
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Performance metrics',
  },
  {
    title: 'Automations',
    href: '/dashboard/automations',
    icon: Sparkles,
    description: 'Follow-ups & workflow builder',
  },
  {
    title: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
    description: 'Create and manage invoices',
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
];

const DashboardContentFallback = () => (
  <div className='flex min-h-[320px] items-center justify-center text-muted-foreground' role='status' aria-live='polite'>
    <Loader2 className='h-6 w-6 animate-spin text-primary' />
    <span className='sr-only'>Loading dashboard content…</span>
  </div>
);

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
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
  const [inboxLoading, setInboxLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(14);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(false);
  const location = useLocation();

  // Fetch actual inbox count
  useEffect(() => {
    const fetchInboxCount = async () => {
      try {
        setInboxLoading(true);
        const threadsResp = await client.get('/threads');
        const threadsList = threadsResp?.data?.data?.threads || threadsResp?.data || [];
        setInboxCount(threadsList.length);
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
    const mq = window.matchMedia('(max-width: 768px)');
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Set initial
    setIsMobile(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Allow other components (e.g., header menu on Inbox) to control the global mobile sidebar
  useEffect(() => {
    const toggle = () => setMobileOpen((v) => !v);
    const open = () => setMobileOpen(true);
    const close = () => setMobileOpen(false);
    window.addEventListener('lb:toggle-global-sidebar', toggle);
    window.addEventListener('lb:open-global-sidebar', open);
    window.addEventListener('lb:close-global-sidebar', close);
    return () => {
      window.removeEventListener('lb:toggle-global-sidebar', toggle);
      window.removeEventListener('lb:open-global-sidebar', open);
      window.removeEventListener('lb:close-global-sidebar', close);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lb_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage:', error);
    }
  }, [sidebarCollapsed]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const response = await client.get(endpoints.billing.subscription);
        const payload = response?.data?.data || response?.data;
        if (payload) {
          setSubscription(payload.subscription ?? null);
          if (typeof payload.trialDaysRemaining === 'number') {
            setTrialDaysLeft(payload.trialDaysRemaining);
          }
          if (typeof payload.trialEndsAt === 'string') {
            setTrialEndsAt(payload.trialEndsAt);
          }
        }
      } catch (error) {
        console.error('Failed to load subscription info:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const sidebarWidth = useMemo(() => (sidebarCollapsed ? 'w-16' : 'w-64'), [sidebarCollapsed]);
  const formattedRenewal = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const bannerTitle =
    subscription?.status === 'ACTIVE' && subscription.plan ? `${subscription.plan.name} plan active` : 'Manage your leads efficiently';
  const bannerSubtitle = subscriptionLoading
    ? 'Checking subscription status…'
    : subscription?.status === 'ACTIVE'
    ? formattedRenewal
      ? `Renews ${formattedRenewal}`
      : 'Thanks for being part of LeadsBox!'
    : trialDaysLeft > 0
    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in trial`
    : 'Trial ended — choose a plan to stay connected.';
  const collapsedSubtitle = subscription?.status === 'ACTIVE' && subscription.plan ? subscription.plan.name : bannerSubtitle;
  const handleGoToBilling = () => navigate('/dashboard/billing');
  const billingButtonText = subscription?.status === 'ACTIVE' ? 'Manage billing' : 'View payment plans';

  return (
    <div className='dashboard-container flex h-screen overflow-hidden'>
      {/* Desktop Sidebar */}
      <aside
        className={cn('dashboard-sidebar hidden md:flex flex-col border-r bg-sidebar transition-[width] duration-300 ease-in-out', sidebarWidth)}
        aria-label='Sidebar'
      >
        {/* Sidebar header */}
        <div className='flex h-16 items-center justify-between px-4 border-b border-sidebar-border'>
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
            {sidebarItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'sidebar-item-base',
                    sidebarCollapsed ? 'sidebar-item-collapsed' : '',
                    isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
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
                        {item.title === 'Inbox' && inboxCount > 0 && (
                          <Badge
                            variant={isActive ? 'secondary' : 'outline'}
                            className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'
                          >
                            {inboxLoading ? '...' : inboxCount}
                          </Badge>
                        )}
                        {item.title === 'Tasks' && item.badge && (
                          <Badge
                            variant={isActive ? 'secondary' : 'outline'}
                            className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}

                    {sidebarCollapsed && item.title === 'Inbox' && inboxCount > 0 && (
                      <Badge variant='destructive' className='absolute top-1 right-1 h-4 w-4 flex items-center justify-center text-xs p-0'>
                        {inboxLoading ? '...' : inboxCount}
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
        <div className='border-t border-sidebar-border p-4'>
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
            'absolute inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border shadow-lg',
            'transition-transform duration-300 ease-in-out will-change-transform',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          role='dialog'
          aria-modal='true'
          aria-label='Mobile Sidebar'
        >
          {/* Sidebar header */}
          <div className='flex h-16 items-center justify-between px-4 border-b border-sidebar-border'>
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
              {sidebarItems.map((item) => {
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
                      {item.badge && (
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
          <div className='border-t border-sidebar-border p-4'>
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
        {/* Header */}
        <DashboardHeader onSidebarToggle={toggleSidebar} sidebarOpen={isMobile ? mobileOpen : !sidebarCollapsed} />

        {/* Page content */}
        <section className='dashboard-main flex-1 overflow-auto' aria-label='Dashboard content'>
          <Suspense fallback={<DashboardContentFallback />}>
            <Outlet />
          </Suspense>
        </section>
      </div>
    </div>
  );
};

export default DashboardLayout;
