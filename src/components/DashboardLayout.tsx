// Dashboard Layout Component for LeadsBox

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, Users, Zap, CheckSquare, BarChart3, Settings, ChevronLeft, Inbox, Target, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import DashboardHeader from './DashboardHeader';

const sidebarItems = [
  {
    title: 'Inbox',
    href: '/dashboard/inbox',
    icon: Inbox,
    badge: 12,
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
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
];

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className='dashboard-container flex h-screen overflow-hidden'>
      {/* Sidebar */}
      <aside
        className={cn(
          'dashboard-sidebar flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
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

          <Button variant='ghost' size='icon' onClick={toggleSidebar} className='h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent'>
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
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <item.icon className='h-5 w-5 flex-shrink-0' />

                  {!sidebarCollapsed && (
                    <>
                      <span className='ml-3 flex-1'>{item.title}</span>
                      {item.badge && (
                        <Badge variant={isActive ? 'secondary' : 'outline'} className='ml-auto h-5 w-5 flex items-center justify-center text-xs p-0'>
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}

                  {sidebarCollapsed && item.badge && (
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

      {/* Main content area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <DashboardHeader onSidebarToggle={toggleSidebar} sidebarOpen={!sidebarCollapsed} />

        {/* Page content */}
        <main className='dashboard-main flex-1 overflow-auto bg-background'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
