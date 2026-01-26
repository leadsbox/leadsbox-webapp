import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

const queryClient = new QueryClient();

const AppProviders = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <AnalyticsProvider>
          <Outlet />
        </AnalyticsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppProviders;
