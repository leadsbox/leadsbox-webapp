import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AnalyticsProvider } from './context/AnalyticsContext';

const queryClient = new QueryClient();

const AppProviders = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AnalyticsProvider>
        <Outlet />
      </AnalyticsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppProviders;
