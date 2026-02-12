import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';

let analyticsInitialized = false;

const parseSampleRate = (rawValue: string | undefined, fallback: number): number => {
  if (!rawValue) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
};

export const initAnalytics = () => {
  if (analyticsInitialized) {
    return;
  }

  try {
    // Initialize PostHog
    const posthogKey = import.meta.env.VITE_POSTHOG_KEY || import.meta.env.REACT_APP_POSTHOG_KEY;
    const posthogHost = import.meta.env.VITE_POSTHOG_HOST || import.meta.env.REACT_APP_POSTHOG_HOST;

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
        tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.1),
        // Session Replay
        replaysSessionSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE, 0.1),
        replaysOnErrorSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE, 1.0),
      });
    }

    analyticsInitialized = true;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  try {
    if (import.meta.env.VITE_POSTHOG_KEY || import.meta.env.REACT_APP_POSTHOG_KEY) {
      posthog.identify(userId, traits);
    }
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser({ id: userId, ...traits });
    }
  } catch (error) {
    console.error('Failed to identify user in analytics:', error);
  }
};

export const resetAnalytics = () => {
  try {
    if (import.meta.env.VITE_POSTHOG_KEY || import.meta.env.REACT_APP_POSTHOG_KEY) {
      posthog.reset();
    }
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser(null);
    }
  } catch (error) {
    console.error('Failed to reset analytics:', error);
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (import.meta.env.VITE_POSTHOG_KEY || import.meta.env.REACT_APP_POSTHOG_KEY) {
      posthog.capture(eventName, properties);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};
