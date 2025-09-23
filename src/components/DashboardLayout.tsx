// Dashboard Layout Component for LeadsBox

import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, Users, Zap, CheckSquare, BarChart3, Settings, ChevronLeft, Inbox, Target, Calendar, FileText, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import DashboardHeader from './DashboardHeader';
import client from '../api/client';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
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
    title: 'Pipeline',
    href: '/dashboard/pipeline',
    icon: Target,
    description: 'Sales pipeline stages',
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
    description: 'Templates & follow-ups',
  },
  {
    title: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
    description: 'Create and manage invoices',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
];

export const DashboardLayout: React.FC = () => {
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

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const sidebarWidth = useMemo(() => (sidebarCollapsed ? 'w-16' : 'w-64'), [sidebarCollapsed]);

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
                <img src='/leadsboxlogo.svg' alt='LeadsBox Logo' className='w-full h-full object-contain' />
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
          <div className='space-y-1 px-3'>
            {sidebarItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <item.icon className='h-5 w-5 flex-shrink-0' />

                  {!sidebarCollapsed && (
                    <>
                      <span className='ml-3 flex-1'>{item.title}</span>
                      {item.title === 'Inbox' && inboxCount > 0 && (
                        <Badge variant={isActive ? 'secondary' : 'outline'} className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
                          {inboxLoading ? '...' : inboxCount}
                        </Badge>
                      )}
                      {item.title === 'Tasks' && item.badge && (
                        <Badge variant={isActive ? 'secondary' : 'outline'} className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
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
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className='border-t border-sidebar-border p-4'>
          {!sidebarCollapsed && (
            <div className='text-xs text-sidebar-foreground/70'>
              <div className='font-medium mb-1'>LeadsBox Dashboard</div>
              <div>Manage your leads efficiently</div>
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
                <img src='/leadsboxlogo.svg' alt='LeadsBox Logo' className='w-full h-full object-contain' />
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
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground'
                    )}
                  >
                    <item.icon className='h-5 w-5 flex-shrink-0' />
                    <span className='ml-3 flex-1'>{item.title}</span>
                    {item.badge && (
                      <Badge variant={isActive ? 'secondary' : 'outline'} className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>
          {/* Sidebar footer */}
          <div className='border-t border-sidebar-border p-4'>
            <div className='text-xs text-sidebar-foreground/70'>
              <div className='font-medium mb-1'>LeadsBox Dashboard</div>
              <div>Manage your leads efficiently</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Main content area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <DashboardHeader onSidebarToggle={toggleSidebar} sidebarOpen={isMobile ? mobileOpen : !sidebarCollapsed} />

        {/* Page content */}
        <main className='dashboard-main flex-1 overflow-auto bg-background'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
