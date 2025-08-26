import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from '../types';
import client from '../api/client';
import { endpoints } from '../api/config';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setOrg: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from server
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await client.get(endpoints.profile);
        if (data?.user) {
          setUser(data.user);
          if (data.user.currentOrgId) {
            // Handle org ID if needed
          }
        }
      } catch (error) {
        console.warn('Not authenticated or session expired');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<void> => {
    setIsLoading(true);
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
      setIsLoading(false);
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

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
    setOrg,
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