// Authentication Context for LeadsBox Dashboard

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from '../types';
import { apiRequest } from '../lib/axios';
import { endpoints, CACHE_KEYS } from '../api/config';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(CACHE_KEYS.token);
        const savedUser = localStorage.getItem(CACHE_KEYS.user);

        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Optionally verify token with server
          try {
            const response = await apiRequest.get(endpoints.profile);
            if (response.data.success) {
              setUser(response.data.data);
              localStorage.setItem(CACHE_KEYS.user, JSON.stringify(response.data.data));
            }
          } catch (error) {
            // Token might be expired, will be handled by axios interceptor
            console.warn('Failed to verify token on init');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await apiRequest.post<{ success: boolean; data: AuthResponse }>(
        endpoints.login,
        credentials
      );

      if (response.data.success) {
        const { user: userData, token, refreshToken } = response.data.data;

        // Store auth data
        localStorage.setItem(CACHE_KEYS.token, token);
        localStorage.setItem(CACHE_KEYS.refreshToken, refreshToken);
        localStorage.setItem(CACHE_KEYS.user, JSON.stringify(userData));
        
        if (userData.currentOrgId) {
          localStorage.setItem(CACHE_KEYS.organization, userData.currentOrgId);
        }

        setUser(userData);
        toast.success(`Welcome back, ${userData.name}!`);
        
        return response.data.data;
      } else {
        throw new Error('Login failed');
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await apiRequest.post<{ success: boolean; data: AuthResponse }>(
        endpoints.register,
        data
      );

      if (response.data.success) {
        const { user: userData, token, refreshToken } = response.data.data;

        // Store auth data
        localStorage.setItem(CACHE_KEYS.token, token);
        localStorage.setItem(CACHE_KEYS.refreshToken, refreshToken);
        localStorage.setItem(CACHE_KEYS.user, JSON.stringify(userData));
        
        if (userData.currentOrgId) {
          localStorage.setItem(CACHE_KEYS.organization, userData.currentOrgId);
        }

        setUser(userData);
        toast.success(`Welcome to LeadsBox, ${userData.name}!`);
        
        return response.data.data;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(CACHE_KEYS.token);
    localStorage.removeItem(CACHE_KEYS.refreshToken);
    localStorage.removeItem(CACHE_KEYS.user);
    localStorage.removeItem(CACHE_KEYS.organization);
    localStorage.removeItem(CACHE_KEYS.preferences);

    // Clear state
    setUser(null);

    // Optionally notify server
    try {
      apiRequest.post(endpoints.logout);
    } catch (error) {
      // Ignore logout errors
    }

    toast.info('You have been logged out');
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const response = await apiRequest.get(endpoints.profile);
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem(CACHE_KEYS.user, JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      // Will be handled by axios interceptor if token is expired
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem(CACHE_KEYS.user, JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;