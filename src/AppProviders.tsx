import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeadsboxToaster from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmProvider, NetworkBannerProvider, NetworkBannerSurface } from '@/ui/ux';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

const AppProviders = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NetworkBannerProvider>
        <ConfirmProvider>
          <TooltipProvider>
            <LeadsboxToaster />
            <div className='pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4'>
              <NetworkBannerSurface className='max-w-3xl' />
            </div>
            <Outlet />
          </TooltipProvider>
        </ConfirmProvider>
      </NetworkBannerProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppProviders;
