import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import { initAnalytics, identifyUser } from '@/lib/analytics';
import { useAuth } from './useAuth';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();

  // Initialize once
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track Page Views on route change
  useEffect(() => {
    if (import.meta.env.VITE_POSTHOG_KEY || import.meta.env.REACT_APP_POSTHOG_KEY) {
      /*
      try {
        posthog.capture('$pageview');
      } catch (e) {
        console.error('Failed to capture pageview:', e);
      }
      */
    }
  }, [location]);

  // Identify User when logged in
  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.name, // Assuming user object has name
        role: user.role, // Assuming user object has role
      });
    }
  }, [user]);

  return <>{children}</>;
}
