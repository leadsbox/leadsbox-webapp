import axios from 'axios';
import { API_BASE } from './config';

// Token and organization management
const tokenKey = 'lb_access_token';
const orgKey = 'lb_org_id';

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
    'Accept': 'application/json',
  },
});

// Ensure credentials are sent with all requests
client.interceptors.request.use(config => {
  config.withCredentials = true;
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

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

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
        await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Get fresh user data with new token from /auth/me
        const userResponse = await axios.get(
          `${API_BASE}/auth/me`,
          { withCredentials: true }
        );

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
        const isPublicAuthPage = (
          currentPath.startsWith('/login') ||
          currentPath.startsWith('/register') ||
          currentPath.startsWith('/verify-email') ||
          currentPath.startsWith('/forgot-password') ||
          currentPath.startsWith('/reset-password')
        );
        if (!isPublicAuthPage) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
