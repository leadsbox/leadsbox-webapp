import { AlertTriangle, Loader2 } from 'lucide-react';
import { useSocketIO } from '@/lib/socket';
import { Alert, AlertDescription } from './ui/alert';

export function ConnectionStatus() {
  const { isConnected } = useSocketIO();

  // If connected, show nothing
  if (isConnected) return null;

  return (
    <div className='fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2'>
      <Alert variant='warning' className='shadow-lg border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'>
        <div className='flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' />
          <AlertDescription className='text-xs font-medium'>Reconnecting to server...</AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
