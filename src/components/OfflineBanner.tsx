import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Alert, AlertDescription } from './ui/alert';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className='fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top-2'>
      <Alert variant='destructive' className='rounded-none border-b border-destructive/50 flex justify-center py-2 h-auto'>
        <div className='flex items-center gap-2'>
          <WifiOff className='h-4 w-4' />
          <AlertDescription className='font-medium'>You are currently offline. Changes may not be saved.</AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
