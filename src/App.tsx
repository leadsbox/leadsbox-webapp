import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
const AppProviders = lazy(() => import('./AppProviders'));

const DashboardLayout = lazy(() => import('./components/DashboardLayout'));

// Marketing / Auth (keep eager to avoid blank on primary entry paths)
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

// Dashboard Pages (lazy-loaded so the marketing shell stays light)
const InboxPage = lazy(() => import('./features/inbox/InboxPage'));
const LeadsPage = lazy(() => import('./features/leads/LeadsPage'));
const LeadDetailPage = lazy(() => import('./features/leads/LeadDetailPage'));
const SalesPage = lazy(() => import('./features/sales/SalesPage'));
const SaleDetailPage = lazy(() => import('./features/sales/SaleDetailPage'));
const TasksPage = lazy(() => import('./features/tasks/TasksPage'));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const DashboardHomePage = lazy(() => import('./features/dashboard/DashboardHomePage'));
const InvoicesPage = lazy(() => import('./features/invoices/InvoicesPage'));
const InvoiceDetailPage = lazy(() => import('./features/invoices/InvoiceDetailPage'));
const CreateInvoicePage = lazy(() => import('./features/invoices/CreateInvoicePage'));
const ReceiptPage = lazy(() => import('./features/receipts/ReceiptPage'));
const AutomationsPage = lazy(() => import('./features/automations/AutomationsPage'));
const TemplatesHomePage = lazy(() => import('./features/templates/TemplatesHomePage'));
const CreateTemplateWizardPage = lazy(() => import('./features/templates/CreateTemplateWizardPage'));
const TemplateDetailPage = lazy(() => import('./features/templates/TemplateDetailPage'));
const PaymentPlansPage = lazy(() => import('./features/billing/PaymentPlansPage'));
const OrganizationOnboarding = lazy(() => import('./pages/OrganizationOnboarding'));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage'));
const ReferralsPage = lazy(() => import('./features/referrals/ReferralsPage'));

const RouteLoader = () => (
  <div className='flex min-h-screen items-center justify-center text-sm text-muted-foreground'>Loading…</div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path='/' element={<Index />} />
          <Route element={<AppProviders />}>
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/invite/:token' element={<AcceptInvitePage />} />
            <Route path='/verify-email' element={<VerifyEmail />} />
            <Route path='/privacy' element={<PrivacyPolicy />} />
            <Route path='/terms' element={<Terms />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route
              path='/onboarding/organization'
              element={
                <ProtectedRoute requireOrganization={false}>
                  <Suspense fallback={<RouteLoader />}>
                    <OrganizationOnboarding />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Protected Dashboard Routes */}
            <Route
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoader />}>
                    <DashboardLayout />
                  </Suspense>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to='home' replace />} />
              <Route path='home' element={<DashboardHomePage />} />
              <Route path='invoices' element={<InvoicesPage />} />
              <Route path='invoices/:code' element={<InvoiceDetailPage />} />
              <Route path='invoices/new' element={<CreateInvoicePage />} />
              <Route path='receipts/:receiptId' element={<ReceiptPage />} />
              <Route path='inbox' element={<InboxPage />} />
              <Route path='leads' element={<LeadsPage />} />
              <Route path='leads/:leadId' element={<LeadDetailPage />} />
              <Route path='sales' element={<SalesPage />} />
              <Route path='sales/:saleId' element={<SaleDetailPage />} />
              <Route path='tasks' element={<TasksPage />} />
              <Route path='analytics' element={<AnalyticsPage />} />
              <Route path='templates' element={<TemplatesHomePage />} />
              <Route path='templates/new' element={<CreateTemplateWizardPage />} />
              <Route path='templates/:id' element={<TemplateDetailPage />} />
              <Route path='automations' element={<AutomationsPage />} />
              <Route path='billing' element={<PaymentPlansPage />} />
              <Route path='notifications' element={<NotificationsPage />} />
              <Route path='referrals' element={<ReferralsPage />} />
              <Route
                path='settings'
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
