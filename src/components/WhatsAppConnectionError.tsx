import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/brand-icons';

interface WhatsAppConnectionErrorProps {
  onRetry?: () => void;
}

export const WhatsAppConnectionError: React.FC<WhatsAppConnectionErrorProps> = ({ onRetry }) => {
  const handleConnectWhatsApp = () => {
    // Redirect to settings page to connect WhatsApp
    window.location.href = '/dashboard/settings?tab=integrations';
  };

  return (
    <Alert className='border-amber-200 bg-amber-50'>
      <WhatsAppIcon className='h-4 w-4 text-amber-600' />
      <AlertDescription className='text-amber-800'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-medium mb-1'>WhatsApp Not Connected</p>
            <p className='text-sm'>Please connect your WhatsApp Business account to send messages.</p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={handleConnectWhatsApp} className='border-amber-300 text-amber-700 hover:bg-amber-100'>
              Connect WhatsApp
            </Button>
            {onRetry && (
              <Button variant='ghost' size='sm' onClick={onRetry} className='text-amber-700 hover:bg-amber-100'>
                Retry
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
