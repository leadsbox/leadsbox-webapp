import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface IntegrationBadgeProps {
  icon: React.ElementType;   // Lucide icon or any React component
  label: string;             // "WhatsApp" / "Telegram"
  connected: boolean;        // status
  to: string;                // link to settings page
}

export const IntegrationBadge: React.FC<IntegrationBadgeProps> = ({
  icon: Icon,
  label,
  connected,
  to,
}) => {
  return (
    <Link to={to} title={`${label}: ${connected ? 'Connected' : 'Not connected'}`}>
      <Badge
        variant="outline"
        className={
          connected
            ? 'bg-green-500/10 text-green-400 border-green-600/30 gap-1'
            : 'bg-gray-500/10 text-gray-400 border-gray-600/30 gap-1'
        }
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{label}</span>
        <span className="ml-1 hidden md:inline">
          {connected ? 'Connected' : 'Not Connected'}
        </span>
      </Badge>
    </Link>
  );
};
