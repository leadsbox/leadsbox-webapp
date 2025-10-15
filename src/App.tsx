import LeadsboxToaster from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import AcceptInvitePage from './pages/AcceptInvite';

// Dashboard Pages
import InboxPage from './features/inbox/InboxPage';
import LeadsPage from './features/leads/LeadsPage';
import LeadDetailPage from './features/leads/LeadDetailPage';
import PipelinePage from './features/pipeline/PipelinePage';
import TasksPage from './features/tasks/TasksPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import SettingsPage from './features/settings/SettingsPage';
import DashboardHomePage from './features/dashboard/DashboardHomePage';
import InvoicesPage from './features/invoices/InvoicesPage';
import ReceiptPage from './features/receipts/ReceiptPage';
import AutomationsPage from './features/automations/AutomationsPage';
import PaymentPlansPage from './features/billing/PaymentPlansPage';

const queryClient = new QueryClient();

const App = () => {
  const { resolvedTheme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <LeadsboxToaster />
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Index />} />
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/invite/:token' element={<AcceptInvitePage />} />
              <Route path='/verify-email' element={<VerifyEmail />} />
              <Route path='/privacy' element={<PrivacyPolicy />} />
              <Route path='/terms' element={<Terms />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/reset-password' element={<ResetPassword />} />

              {/* Protected Dashboard Routes */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to='home' replace />} />
                <Route path='home' element={<DashboardHomePage />} />
                <Route path='invoices' element={<InvoicesPage />} />
                <Route path='receipts/:receiptId' element={<ReceiptPage />} />
                <Route path='inbox' element={<InboxPage />} />
                <Route path='leads' element={<LeadsPage />} />
                <Route path='leads/:leadId' element={<LeadDetailPage />} />
                <Route path='pipeline' element={<PipelinePage />} />
                <Route path='tasks' element={<TasksPage />} />
                <Route path='analytics' element={<AnalyticsPage />} />
                <Route path='automations' element={<AutomationsPage />} />
                <Route path='billing' element={<PaymentPlansPage />} />
                <Route
                  path='settings'
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all route */}
              <Route path='*' element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
