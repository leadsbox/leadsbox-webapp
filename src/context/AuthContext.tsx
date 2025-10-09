import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from '../types';
import client, { setAccessToken, setOrgId, getOrgId } from '../api/client';
import { endpoints } from '../api/config';
import { clearPendingInvite, loadPendingInvite } from '@/lib/inviteStorage';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    username: string;
    organizationName?: string;
    inviteToken?: string | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setOrg: (id: string) => void;
  acceptInvite: (token: string) => Promise<void>;
};

const Ctx = createContext<AuthState | undefined>(undefined);

const USER_STORAGE_KEY = 'lb_user';

const readCachedUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch (error) {
    console.warn('Failed to parse cached user profile', error);
    return null;
  }
};

const persistUser = (value: AuthUser | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist user profile', error);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cachedUser = readCachedUser();
  const [user, setUserState] = useState<AuthUser | null>(cachedUser);
  const [loading, setloading] = useState(() => (cachedUser ? false : true));

  const setUser = (value: AuthUser | null) => {
    setUserState(value);
    persistUser(value);
  };

  const acceptInvite = async (token: string, options: { silent?: boolean } = {}) => {
    if (!token) return;
    try {
      const previewRes = await client.get(endpoints.orgInvitePreview(token));
      const preview = previewRes?.data?.data;
      const orgName = preview?.organization?.name;
      const role = (preview?.role as string | undefined) || undefined;

      const acceptRes = await client.post(endpoints.orgInviteAccept(token));
      clearPendingInvite();

      const profileRes = await client.get(endpoints.me);
      const nextUser = profileRes?.data?.user as AuthUser | undefined;
      if (nextUser) {
        setUser(nextUser);
        const defaultOrg = nextUser.currentOrgId || nextUser.orgId;
        if (defaultOrg) {
          setOrgId(defaultOrg);
        }
      }

      if (!options.silent) {
        const acceptedRole =
          acceptRes?.data?.data?.role || role
            ? ` as ${(acceptRes?.data?.data?.role || role || '').toLowerCase()}`
            : '';
        toast.success(`You're now part of ${orgName || 'the organization'}${acceptedRole}.`);
      }
    } catch (error: any) {
      if (!options.silent) {
        const message =
          error?.response?.data?.message || 'Failed to accept invitation. Please try again.';
        toast.error(message);
      }
      throw error;
    }
  };

  const acceptPendingInviteIfNeeded = async () => {
    const pendingToken = loadPendingInvite();
    if (!pendingToken) return;
    try {
      await acceptInvite(pendingToken);
    } catch (error) {
      console.error('Pending invite acceptance failed:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!cachedUser) {
          setloading(true);
        }
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const path = window.location.pathname || '';

        if (token && !path.startsWith('/verify-email')) {
          setAccessToken(token);
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const isPublicAuthPage =
          path === '/' ||
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/verify-email') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/reset-password');

        if (isPublicAuthPage) {
          setUser(null);
          setloading(false);
          return;
        }

        const { data } = await client.get(endpoints.me);

        if (data?.user) {
          setUser(data.user);
          if (data.user.orgId) {
            setOrgId(data.user.orgId);
          } else if (!getOrgId()) {
            try {
              const orgRes = await client.get(endpoints.orgs);
              const orgs = orgRes?.data?.data?.orgs || orgRes?.data?.orgs || [];
              if (Array.isArray(orgs) && orgs.length > 0) {
                setOrgId(orgs[0].id);
              }
            } catch (_) {
              // noop
            }
          }
          if (data.accessToken) setAccessToken(data.accessToken);
          await acceptPendingInviteIfNeeded();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
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
      const res = await client.post(endpoints.login, {
        identifier: email,
        password,
      });

      const payload = res?.data?.data || {};
      const profile = payload?.profile;
      const token = payload?.token || payload?.profile?.token;

      if (token) setAccessToken(token);
      if (profile) {
        setUser(profile);
        toast.success(`Welcome back, ${profile.username || profile.email}!`);

        if (profile.orgId) {
          setOrg(profile.orgId);
        } else if (profile.currentOrgId) {
          setOrg(profile.currentOrgId);
        } else if (!getOrgId()) {
          try {
            const orgRes = await client.get(endpoints.orgs);
            const orgs = orgRes?.data?.data?.orgs || orgRes?.data?.orgs || [];
            if (Array.isArray(orgs) && orgs.length > 0) {
              setOrg(orgs[0].id);
            }
          } catch (_) {
            // noop
          }
        }
        await acceptPendingInviteIfNeeded();
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

  const register = async (params: {
    email: string;
    password: string;
    username: string;
    organizationName?: string;
    inviteToken?: string | null;
  }): Promise<void> => {
    setloading(true);
    try {
      const { email, password, username, organizationName, inviteToken } = params;
      const requestBody: Record<string, unknown> = {
        email,
        password,
        username,
      };

      if (organizationName && organizationName.trim().length > 0) {
        requestBody.organizationName = organizationName.trim();
      }

      if (inviteToken) {
        requestBody.inviteToken = inviteToken;
      }

      const res = await client.post(endpoints.register, requestBody);

      const payload = res?.data?.data || {};
      const profile = payload?.profile; // register returns token inside profile
      const token = payload?.token || payload?.profile?.token;

      if (token) setAccessToken(token);
      if (profile) {
        setUser(profile);
        toast.success(`Welcome to LeadsBox, ${profile.username || profile.email}!`);
        // Org is created server-side during register; if backend returns orgId later we can set it here
        if (profile.orgId) {
          setOrg(profile.orgId);
        } else if (profile.currentOrgId) {
          setOrg(profile.currentOrgId);
        }
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
    } finally {
      setUser(null);
      toast.info('You have been logged out');
    }
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
    setOrgId(id);
    setUserState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, orgId: id, currentOrgId: id } as AuthUser;
      persistUser(next);
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, setOrg, refreshAuth, acceptInvite }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
