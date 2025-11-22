import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';

export const initAnalytics = () => {
  // Initialize PostHog
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost || 'https://app.posthog.com',
      capture_pageview: false, // We handle this manually in the provider to support SPA routing
      persistence: 'localStorage',
      autocapture: true,
    });
  } else {
    console.warn('PostHog Key not found. Analytics disabled.');
  }

  // Initialize Sentry
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, 
      // Session Replay
      replaysSessionSampleRate: 0.1, 
      replaysOnErrorSampleRate: 1.0, 
    });
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.identify(userId, traits);
  }
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({ id: userId, ...traits });
  }
};

export const resetAnalytics = () => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.reset();
  }
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  }
};
