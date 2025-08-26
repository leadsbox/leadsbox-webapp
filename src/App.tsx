import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from "./context/AuthContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import InboxPage from "./features/inbox/InboxPage";
import LeadsPage from "./features/leads/LeadsPage";
import PipelinePage from "./features/pipeline/PipelinePage";
import TasksPage from "./features/tasks/TasksPage";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import SettingsPage from "./features/settings/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            
            {/* Dashboard Routes - No Protection */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<InboxPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
