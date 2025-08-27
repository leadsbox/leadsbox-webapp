import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from '../types';
import client, { setAccessToken, setOrgId } from '../api/client';
import { endpoints } from '../api/config';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setOrg: (id: string) => void;
};

const Ctx = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we're coming back from OAuth
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          // We have a token from OAuth, store it
          setAccessToken(token);
          // Remove token from URL to prevent issues
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Get user data
        const { data } = await client.get(endpoints.me);

        if (data?.user) {
          setUser(data.user);
          if (data.user.orgId) setOrgId(data.user.orgId);
          if (data.accessToken) setAccessToken(data.accessToken);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        // Clear invalid tokens
        localStorage.removeItem('lb_access_token');
        localStorage.removeItem('lb_org_id');
      } finally {
        setloading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setloading(true);
    try {
      const { data } = await client.post<AuthResponse>(endpoints.login, {
        email,
        password,
      });

      if (data?.user) {
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.username}!`);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<void> => {
    setloading(true);
    try {
      const { data } = await client.post<AuthResponse>(endpoints.register, {
        email,
        password,
        name,
      });

      if (data?.user) {
        setUser(data.user);
        toast.success(`Welcome to LeadsBox, ${data.user.username}!`);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const logout = async () => {
    try {
      await client.post(endpoints.logout);
      localStorage.removeItem('lb_access_token');
      localStorage.removeItem('lb_org_id');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
    setUser(null);
    toast.info('You have been logged out');
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const { data } = await client.get(endpoints.profile);
      if (data?.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      // Will be handled by axios interceptor if token is expired
    }
  };

  const setOrg = (id: string) => setOrgId(id);

  return <Ctx.Provider value={{ user, loading, login, register, logout, setOrg, refreshAuth }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
