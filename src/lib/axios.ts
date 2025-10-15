// Axios client setup for LeadsBox Dashboard

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE, STATUS_CODES, ERROR_MESSAGES, CACHE_KEYS } from '../api/config';
import { notify } from '@/lib/toast';

const asMessage = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const toErrorDetail = (fallback: string, ...candidates: Array<unknown>): string => {
  for (const candidate of candidates) {
    const message = asMessage(candidate);
    if (message) {
      return message;
    }
  }
  return fallback;
};

// Create axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem(CACHE_KEYS.token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add organization context if available
    const orgId = localStorage.getItem(CACHE_KEYS.organization);
    if (orgId) {
      config.headers['X-Organization-ID'] = orgId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const { response, request } = error;

    // Handle different error scenarios
    if (response) {
      const { status, data } = response;

      switch (status) {
        case STATUS_CODES.UNAUTHORIZED: {
          // Clear auth data and redirect to login
          localStorage.removeItem(CACHE_KEYS.token);
          localStorage.removeItem(CACHE_KEYS.refreshToken);
          localStorage.removeItem(CACHE_KEYS.user);

          // Try to refresh token first
          const refreshToken = localStorage.getItem(CACHE_KEYS.refreshToken);
          if (refreshToken) {
            try {
              const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, {
                refreshToken,
              });

              const { token, refreshToken: newRefreshToken } = refreshResponse.data.data;

              localStorage.setItem(CACHE_KEYS.token, token);
              localStorage.setItem(CACHE_KEYS.refreshToken, newRefreshToken);

              // Retry the original request
              const originalRequest = error.config;
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosClient(originalRequest);
            } catch (refreshError) {
              notify.error({
                key: 'http:401',
                title: 'Session expired',
                description: ERROR_MESSAGES.UNAUTHORIZED,
              });
              window.location.href = '/login';
            }
          } else {
            notify.error({
              key: 'http:401',
              title: 'Session expired',
              description: ERROR_MESSAGES.UNAUTHORIZED,
            });
            window.location.href = '/login';
          }
          break;
        }

        case STATUS_CODES.FORBIDDEN: {
          notify.error({
            key: 'http:403',
            title: 'Access denied',
            description: toErrorDetail(ERROR_MESSAGES.FORBIDDEN, data?.message),
          });
          break;
        }

        case STATUS_CODES.NOT_FOUND: {
          notify.error({
            key: 'http:404',
            title: 'Not found',
            description: toErrorDetail(ERROR_MESSAGES.NOT_FOUND, data?.message),
          });
          break;
        }

        case STATUS_CODES.UNPROCESSABLE_ENTITY: {
          if (data?.errors && Array.isArray(data.errors)) {
            const merged = data.errors
              .map((err: unknown) => asMessage(err))
              .filter((message): message is string => Boolean(message))
              .join('; ');
            notify.warning({
              key: 'http:422',
              title: 'Check your request',
              description: merged || toErrorDetail(ERROR_MESSAGES.VALIDATION_ERROR, data?.message),
            });
          } else {
            notify.warning({
              key: 'http:422',
              title: 'Check your request',
              description: toErrorDetail(ERROR_MESSAGES.VALIDATION_ERROR, data?.message),
            });
          }
          break;
        }

        case STATUS_CODES.INTERNAL_SERVER_ERROR:
        case STATUS_CODES.BAD_GATEWAY:
        case STATUS_CODES.SERVICE_UNAVAILABLE: {
          notify.error({
            key: 'http:5xx',
            title: 'Server issue',
            description: ERROR_MESSAGES.SERVER_ERROR,
          });
          break;
        }

        default: {
          notify.error({
            key: `http:${status ?? 'error'}`,
            title: 'Request failed',
            description: toErrorDetail('An unexpected error occurred', data?.message),
          });
          break;
        }
      }
    } else if (request) {
      // Network error
      notify.error({
        key: 'http:network',
        title: 'Network issue',
        description: ERROR_MESSAGES.NETWORK_ERROR,
      });
    } else {
      // Something else happened
      notify.error({
        key: 'http:request-setup',
        title: 'Request setup failed',
        description: 'We could not prepare your request. Please try again.',
      });
    }

    return Promise.reject(error);
  }
);

// Utility functions for common request patterns
export const apiRequest = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => axiosClient.get<T>(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => axiosClient.post<T>(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => axiosClient.put<T>(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => axiosClient.patch<T>(url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => axiosClient.delete<T>(url, config),
};

// File upload helper
export const uploadFile = async (url: string, file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);

  return axiosClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};

// Connection status helper
export const checkConnection = async (): Promise<boolean> => {
  try {
    await axiosClient.get('/health');
    return true;
  } catch {
    return false;
  }
};

export default axiosClient;
