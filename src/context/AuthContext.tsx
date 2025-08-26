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
    (async () => {
      try {
        const { data } = await client.get(endpoints.me);

        if (data?.user) {
          setUser(data.user);
          if (data.user.orgId) setOrgId(data.user.orgId);
          if (data.accessToken) setAccessToken(data.accessToken);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setloading(false);
      }
    })();
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
        toast.success(`Welcome back, ${data.user.name}!`);
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
        toast.success(`Welcome to LeadsBox, ${data.user.name}!`);
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
    } catch (error) {
      // Ignore logout errors
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

  const setOrg = (id: string) => {
    // Handle org ID changes if needed
    console.log('Organization ID set to:', id);
  };

  const value: AuthState = {
    user,
    loading,
    login,
    register,
    logout,
    refreshAuth,
    setOrg,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthState => {
  const context = useContext(Ctx);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default Ctx;
