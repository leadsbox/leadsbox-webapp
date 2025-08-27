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
  Zap
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';

interface DashboardHeaderProps {
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onSidebarToggle,
  sidebarOpen = true,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Get user's first initial or 'U' if no name is available
  const userInitial = user?.name?.[0]?.toUpperCase() || 'U';
  // Use the avatar from Google if available, otherwise use the default avatar
  const userAvatar = user?.avatar || '';
  // Get the user's display name, falling back to email if name is not available
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const navigationItems = [
    { path: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare, badge: 12 },
    { path: '/dashboard/leads', label: 'Leads', icon: Users },
    { path: '/dashboard/pipeline', label: 'Pipeline', icon: Zap },
    { path: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, badge: 3 },
    { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const currentPage = navigationItems.find(item => 
    location.pathname.startsWith(item.path)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="dashboard-header h-16 px-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-md">
      {/* Left section - Logo and navigation */}
      <div className="flex items-center space-x-4">
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-lg text-foreground hidden sm:block">
            LeadsBox
          </span>
        </Link>

        {/* Current page indicator */}
        <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
          <span>/</span>
          <span className="text-foreground font-medium">
            {currentPage?.label || 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads, messages, tasks..."
            className="pl-10 bg-muted/50 border-muted-foreground/20 focus:bg-background"
          />
        </div>
      </div>

      {/* Right section - Actions and user menu */}
      <div className="flex items-center space-x-2">
        {/* Search button for mobile */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="text-base">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-auto">
              <DropdownMenuItem className="flex-col items-start space-y-1 py-3">
                <div className="flex w-full justify-between">
                  <span className="font-medium">New lead from WhatsApp</span>
                  <span className="text-xs text-muted-foreground">2m ago</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  John Doe is interested in your services
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start space-y-1 py-3">
                <div className="flex w-full justify-between">
                  <span className="font-medium">Task reminder</span>
                  <span className="text-xs text-muted-foreground">15m ago</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Follow up call with Sarah Johnson is due
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start space-y-1 py-3">
                <div className="flex w-full justify-between">
                  <span className="font-medium">Pipeline update</span>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  3 leads moved to qualified stage
                </span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} alt={displayName} />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{displayName}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <Badge variant="secondary" className="w-fit text-xs mt-1">
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;