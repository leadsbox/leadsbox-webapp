import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE } from './config';
import { publishNetworkBanner } from '@/ui/ux/network-events';
import { getMonitoredFlow, recordApiFlowResult } from '@/lib/apiMonitoring';

// Extend the axios request config to include our custom _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _startedAt?: number;
}

// Token and organization management
const tokenKey = 'lb_access_token';
const orgKey = 'lb_org_id';
const buildRequestId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export const getAccessToken = () => localStorage.getItem(tokenKey) || '';

export const setAccessToken = (token?: string) => {
  if (!token) {
    localStorage.removeItem(tokenKey);
  } else {
    localStorage.setItem(tokenKey, token);
  }
};

export const getOrgId = () => localStorage.getItem(orgKey) || '';

export const setOrgId = (id?: string) => {
  if (!id) {
    localStorage.removeItem(orgKey);
  } else {
    localStorage.setItem(orgKey, id);
  }
};

// Create axios instance with base URL
const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // This is crucial for sending cookies with cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Ensure credentials are sent with all requests
client.interceptors.request.use((config) => {
  config.withCredentials = true;
  (config as InternalAxiosRequestConfig & { _startedAt?: number })._startedAt = Date.now();

  if (!config.headers['x-request-id']) {
    const requestId = buildRequestId();
    config.headers['x-request-id'] = requestId;
    config.headers['x-correlation-id'] = requestId;
  }

  return config;
});

// Request interceptor for auth token and org ID
client.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const orgId = getOrgId();
  if (orgId) {
    config.headers['x-org-id'] = orgId;
  }

  return config;
});

// Response interceptor for token refresh
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const API_BANNER_SOURCE = 'api';
const RATE_LIMIT_BANNER_ID = 'api-rate-limit';
const SERVER_ERROR_BANNER_ID = 'api-server-error';
const AUTH_BANNER_ID = 'api-auth';
const NETWORK_FAILURE_BANNER_ID = 'api-network-failure';

const dismissBanner = (id: string) => publishNetworkBanner({ type: 'dismiss', id });

const showBanner = (
  id: string,
  payload: {
    title: string;
    description?: string;
    variant: 'info' | 'warning' | 'error';
    actionLabel?: string;
    actionHref?: string;
    actionOnClick?: () => void;
    autoHideMs?: number;
  }
) => {
  publishNetworkBanner({
    type: 'show',
    banner: {
      id,
      title: payload.title,
      description: payload.description,
      variant: payload.variant,
      autoHideMs: payload.autoHideMs,
      source: API_BANNER_SOURCE,
      dismissible: true,
      action:
        payload.actionLabel && (payload.actionHref || payload.actionOnClick)
          ? {
              label: payload.actionLabel,
              href: payload.actionHref,
              onClick: payload.actionOnClick,
            }
          : undefined,
    },
  });
};

client.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & { _startedAt?: number };
    const flow = getMonitoredFlow(config?.url, config?.method);
    if (flow) {
      recordApiFlowResult({
        flow,
        durationMs: config._startedAt ? Date.now() - config._startedAt : 0,
        status: response.status,
        ok: true,
      });
    }

    if (response.status < 400) {
      dismissBanner(SERVER_ERROR_BANNER_ID);
      dismissBanner(NETWORK_FAILURE_BANNER_ID);
      dismissBanner(RATE_LIMIT_BANNER_ID);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    const status = error?.response?.status;
    const flow = getMonitoredFlow(originalRequest?.url, originalRequest?.method);
    if (flow) {
      recordApiFlowResult({
        flow,
        durationMs: originalRequest?._startedAt ? Date.now() - (originalRequest._startedAt as number) : 0,
        status,
        ok: false,
      });
    }

    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      const requestUrl = originalRequest.url ?? '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password') ||
        requestUrl.includes('/auth/verify-email');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If refresh token process is already happening, wait for it
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push(() => resolve(client(originalRequest)));
        });
      }

      isRefreshing = true;

      try {
        // Attempt to refresh the token
        await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });

        // Get fresh user data with new token from /auth/me
        const userResponse = await axios.get(`${API_BASE}/auth/me`, { withCredentials: true });

        const newToken = userResponse?.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
        }

        // Process pending requests
        pendingRequests.forEach((callback) => callback());
        pendingRequests = [];

        // Retry the original request
        return client(originalRequest);
      } catch (refreshError) {
        // Clear auth state on refresh failure
        setAccessToken('');
        setOrgId('');
        // Only redirect if not already on public auth pages
        const currentPath = window.location.pathname || '';
        const isPublicAuthPage =
          currentPath.startsWith('/login') ||
          currentPath.startsWith('/register') ||
          currentPath.startsWith('/verify-email') ||
          currentPath.startsWith('/forgot-password') ||
          currentPath.startsWith('/reset-password');
        if (!isPublicAuthPage) {
          window.location.href = '/login';
        }
        showBanner(AUTH_BANNER_ID, {
          title: 'Session expired',
          description: 'Please log back in to continue.',
          variant: 'warning',
          actionLabel: 'Go to login',
          actionOnClick: () => {
            window.location.href = '/login';
          },
        });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 429) {
      showBanner(RATE_LIMIT_BANNER_ID, {
        title: 'You’re sending too many requests. Please wait a moment.',
        variant: 'warning',
        autoHideMs: 12_000,
      });
    // } else if (status && status >= 500) {
    //   showBanner(SERVER_ERROR_BANNER_ID, {
    //     title: 'We’re having trouble on our side. Your data is safe.',
    //     description: 'We track these automatically—most recover quickly.',
    //     variant: 'error',
    //   });
    } else if (status === 401) {
      showBanner(AUTH_BANNER_ID, {
        title: 'Session needs attention',
        description: 'We could not verify your credentials. Please sign in again.',
        variant: 'warning',
        actionLabel: 'Reauthenticate',
        actionOnClick: () => {
          window.location.href = '/login';
        },
      });
    } else if (status === 403) {
      const errorData = error.response?.data as { message: string };
      const errorMessage = errorData?.message || '';

      // Handle invalid organization access by clearing the stale ID
      if (
        errorMessage.includes('no access to organization') ||
        errorMessage.includes('Organization not found')
      ) {
        setOrgId('');
        // Force a reload to trigger the org selection flow
        window.location.href = '/';
        return Promise.reject(error);
      }

      showBanner(AUTH_BANNER_ID, {
        title: 'Permission denied',
        description: 'Your current role cannot complete this action.',
        variant: 'info',
      });
    } else if (!status) {
      showBanner(NETWORK_FAILURE_BANNER_ID, {
        title: 'We can’t reach the server.',
        description: 'Check your connection or try again shortly.',
        variant: 'warning',
      });
    }

    return Promise.reject(error);
  }
);

export default client;
