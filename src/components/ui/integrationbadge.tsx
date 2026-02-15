import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface IntegrationBadgeProps {
  icon: React.ElementType; // Lucide icon or any React component
  label: string; // "WhatsApp" / "Telegram"
  connected: boolean; // status
  loading?: boolean; // loading state
  to: string; // link to settings page
  color?: string; // Optional custom color
}

export const IntegrationBadge: React.FC<IntegrationBadgeProps> = ({ icon: Icon, label, connected, loading = false, to, color }) => {
  return (
    <Link to={to} title={`${label}: ${loading ? 'Checking...' : connected ? 'Connected' : 'Not connected'}`}>
      <Badge
        variant='outline'
        className={
          loading
            ? 'bg-blue-500/10 text-blue-400 border-blue-600/30 gap-1'
            : connected
              ? color === 'purple'
                ? 'bg-purple-500/10 text-purple-400 border-purple-600/30 gap-1'
                : 'bg-green-500/10 text-green-400 border-green-600/30 gap-1'
              : 'bg-gray-500/10 text-gray-400 border-gray-600/30 gap-1'
        }
      >
        {loading ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Icon className='h-3.5 w-3.5' />}
        <span className='hidden sm:inline'>{label}</span>
        <span className='ml-1 hidden md:inline'>{loading ? 'Checking...' : connected ? 'Connected' : 'Not Connected'}</span>
      </Badge>
    </Link>
  );
};
