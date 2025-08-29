// Dashboard Header Component for LeadsBox

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Settings,
  LogOut,
  User,
  Search,
  Menu,
  MessageSquare,
  Users,
  BarChart3,
  CheckSquare,
  Zap,
  ChevronDown,
  Check,
  PlusCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { CustomAvatar } from './ui/custom-avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';

interface DashboardHeaderProps {
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onSidebarToggle, sidebarOpen = true }) => {
  const { user, logout } = useAuth();
  console.log(user);
  const location = useLocation();
  // Get the profile image URL
  const userAvatar = user?.profileImage;
  const formatName = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const displayName = user?.username || user?.email?.split('@')[0] || 'Leadsbox User';
  const formattedDisplayName = formatName(displayName);

  const navigationItems = [
    { path: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare, badge: 12 },
    { path: '/dashboard/leads', label: 'Leads', icon: Users },
    { path: '/dashboard/pipeline', label: 'Pipeline', icon: Zap },
    { path: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, badge: 3 },
    { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const currentPage = navigationItems.find((item) => location.pathname.startsWith(item.path));

  const handleLogout = () => {
    logout();
  };

  return (
    <header className='dashboard-header sticky top-0 z-30 h-16 px-3 sm:px-4 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md supports-[backdrop-filter]:bg-card/60'>
      {/* Left section - Logo and navigation */}
      <div className='flex items-center space-x-4'>
        {/* Sidebar toggle */}
        <Button
          variant='ghost'
          size='icon'
          onClick={onSidebarToggle}
          className='md:hidden'
          aria-label='Open menu'
          aria-expanded={sidebarOpen}
          aria-controls='mobile-sidebar'
        >
          <Menu className='h-6 w-6' />
        </Button>

        {/* Workspace Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='gap-2 px-3'>
              <Link to='/dashboard' className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
                <CustomAvatar 
                  src={userAvatar || undefined}
                  name={formattedDisplayName} 
                  size='md' 
                  className='w-full h-full' 
                />
              </Link>
              <div className='text-left hidden sm:block'>
                <p className='text-sm font-medium'>{formattedDisplayName}</p>
                <p className='text-xs text-muted-foreground'>{user?.email}</p>
              </div>
              <ChevronDown className='h-4 w-4 opacity-50' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='start'>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className='p-0'>
              <Link to='/dashboard' className='flex-1 flex items-center justify-between p-2'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 p-1 rounded-sm flex items-center justify-center'>
                    <CustomAvatar
                      src={userAvatar || undefined}
                      name={formattedDisplayName}
                      size='sm'
                      className='w-full h-full'
                    />
                  </div>
                  <div>
                    <p className='text-sm font-medium'>{formattedDisplayName}</p>
                    <p className='text-xs text-muted-foreground'>Personal Workspace</p>
                  </div>
                </div>
                <Check className='h-4 w-4 text-primary' />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <PlusCircle className='mr-2 h-4 w-4' />
              <span>Create New Workspace</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className='mr-2 h-4 w-4' />
              <span>Workspace Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Current page indicator */}
        {/* <div className='hidden md:flex items-center ml-4 border-l border-border pl-4 h-8'>
          <h1 className='text-lg font-semibold text-foreground'>{currentPage?.label || 'Dashboard'}</h1>
        </div> */}
      </div>

      {/* Center section - Search */}
      <div className='flex-1 max-w-md mx-4 hidden lg:block'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search leads, messages, tasks...' className='pl-10 bg-muted/50 border-muted-foreground/20 focus:bg-background' />
        </div>
      </div>

      {/* Right section - Actions and user menu */}
      <div className='flex items-center space-x-2'>
        {/* Search button for mobile */}
        <Button variant='ghost' size='icon' className='lg:hidden'>
          <Search className='h-5 w-5' />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='relative'>
              <Bell className='h-5 w-5' />
              <Badge variant='destructive' className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0'>
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-80'>
            <DropdownMenuLabel className='text-base'>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className='max-h-96 overflow-auto'>
              <DropdownMenuItem className='flex-col items-start space-y-1 py-3'>
                <div className='flex w-full justify-between'>
                  <span className='font-medium'>New lead from WhatsApp</span>
                  <span className='text-xs text-muted-foreground'>2m ago</span>
                </div>
                <span className='text-sm text-muted-foreground'>John Doe is interested in your services</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='flex-col items-start space-y-1 py-3'>
                <div className='flex w-full justify-between'>
                  <span className='font-medium'>Task reminder</span>
                  <span className='text-xs text-muted-foreground'>15m ago</span>
                </div>
                <span className='text-sm text-muted-foreground'>Follow up call with Sarah Johnson is due</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='flex-col items-start space-y-1 py-3'>
                <div className='flex w-full justify-between'>
                  <span className='font-medium'>Pipeline update</span>
                  <span className='text-xs text-muted-foreground'>1h ago</span>
                </div>
                <span className='text-sm text-muted-foreground'>3 leads moved to qualified stage</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-center justify-center'>View all notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='relative h-9 w-9 rounded-full p-0'>
              <CustomAvatar src={userAvatar} name={formattedDisplayName} size='md' className='border-2 border-background' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm font-medium leading-none'>{user?.username}</p>
                <p className='text-xs leading-none text-muted-foreground'>{user?.email}</p>
                <Badge variant='secondary' className='w-fit text-xs mt-1'>
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Mobile-only: open global navigation drawer */}
            <DropdownMenuItem className='md:hidden' onClick={() => window.dispatchEvent(new CustomEvent('lb:toggle-global-sidebar'))}>
              <Menu className='mr-2 h-4 w-4' />
              <span>Open Navigation</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className='md:hidden' />
            <DropdownMenuItem asChild>
              <Link to='/dashboard/settings' className='cursor-pointer'>
                <User className='mr-2 h-4 w-4' />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/dashboard/settings' className='cursor-pointer'>
                <Settings className='mr-2 h-4 w-4' />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
