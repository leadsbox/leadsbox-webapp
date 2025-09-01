
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, type Theme } from "./context/ThemeContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";

// Dashboard Pages
import InboxPage from "./features/inbox/InboxPage";
import LeadsPage from "./features/leads/LeadsPage";
import PipelinePage from "./features/pipeline/PipelinePage";
import TasksPage from "./features/tasks/TasksPage";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import SettingsPage from "./features/settings/SettingsPage";
import DashboardHomePage from "./features/dashboard/DashboardHomePage";
import InvoicesPage from "./features/invoices/InvoicesPage";

const queryClient = new QueryClient();

// Initialize theme before app renders
const initializeTheme = () => {
  // Set initial theme variables
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('theme') as Theme || 'system';
  const savedAccent = localStorage.getItem('accentColor');
  const accent = savedAccent ? JSON.parse(savedAccent) : {
    name: 'Blue',
    value: 'blue',
    hsl: '221 83% 53%'
  };
  
  // Apply theme
  root.classList.remove('light', 'dark');
  if (savedTheme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(savedTheme);
  }
  
  // Apply accent color
  root.style.setProperty('--primary', accent.hsl);
  root.style.setProperty('--accent', accent.hsl);
  root.style.setProperty('--brand', accent.hsl);
  root.style.setProperty('--ring', accent.hsl);
  
  // Set hover state
  const [h, s, l] = accent.hsl.split(' ').map(Number);
  const hoverHsl = `${h} ${s}% ${Math.max(0, l - 5)}%`;
  root.style.setProperty('--primary-hover', hoverHsl);
};

// Initialize theme before rendering the app
initializeTheme();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardHomePage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute >
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
