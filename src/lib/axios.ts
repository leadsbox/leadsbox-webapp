// Axios client setup for LeadsBox Dashboard

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { API_BASE, STATUS_CODES, ERROR_MESSAGES, CACHE_KEYS } from '../api/config';

// Create axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
        case STATUS_CODES.UNAUTHORIZED:
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
              toast.error(ERROR_MESSAGES.UNAUTHORIZED);
              window.location.href = '/login';
            }
          } else {
            toast.error(ERROR_MESSAGES.UNAUTHORIZED);
            window.location.href = '/login';
          }
          break;
          
        case STATUS_CODES.FORBIDDEN:
          toast.error(data?.message || ERROR_MESSAGES.FORBIDDEN);
          break;
          
        case STATUS_CODES.NOT_FOUND:
          toast.error(data?.message || ERROR_MESSAGES.NOT_FOUND);
          break;
          
        case STATUS_CODES.UNPROCESSABLE_ENTITY:
          if (data?.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err: string) => toast.error(err));
          } else {
            toast.error(data?.message || ERROR_MESSAGES.VALIDATION_ERROR);
          }
          break;
          
        case STATUS_CODES.INTERNAL_SERVER_ERROR:
        case STATUS_CODES.BAD_GATEWAY:
        case STATUS_CODES.SERVICE_UNAVAILABLE:
          toast.error(ERROR_MESSAGES.SERVER_ERROR);
          break;
          
        default:
          toast.error(data?.message || 'An unexpected error occurred');
      }
    } else if (request) {
      // Network error
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Something else happened
      toast.error('Request setup failed');
    }
    
    return Promise.reject(error);
  }
);

// Utility functions for common request patterns
export const apiRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    axiosClient.get<T>(url, config),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosClient.post<T>(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosClient.put<T>(url, data, config),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosClient.patch<T>(url, data, config),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    axiosClient.delete<T>(url, config),
};

// File upload helper
export const uploadFile = async (
  url: string, 
  file: File, 
  onProgress?: (progress: number) => void
) => {
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