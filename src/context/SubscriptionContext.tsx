import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import client, { getOrgId } from '@/api/client';
import { endpoints } from '@/api/config';
import { SubscriptionSummary } from '../types';
import { useAuth } from './useAuth';

interface SubscriptionContextType {
  subscription: SubscriptionSummary | null;
  loading: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  refreshSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    const orgId = getOrgId();
    if (!user || !orgId) {
      setLoading(false);
      return;
    }

    try {
      // Don't set loading true here to avoid flickering on refresh
      const response = await client.get(endpoints.billing.subscription);
      const payload = response?.data?.data || response?.data;

      if (payload) {
        setSubscription(payload.subscription ?? null);

        // Handle trial days logic from API
        if (typeof payload.trialDaysRemaining === 'number') {
          setTrialDaysRemaining(payload.trialDaysRemaining);
        } else {
          setTrialDaysRemaining(0);
        }

        if (typeof payload.trialEndsAt === 'string') {
          setTrialEndsAt(payload.trialEndsAt);
        } else {
          setTrialEndsAt(null);
        }
      } else {
        setSubscription(null);
        setTrialDaysRemaining(0);
      }
    } catch (error) {
      console.error('Failed to load subscription info:', error);
      // In case of error, we don't block access optimistically, or we could set error state
      // For now, simple logging
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refreshSubscription = async () => {
    setLoading(true);
    await fetchSubscription();
  };

  const hasActiveSubscription = Boolean(subscription && subscription.status === 'ACTIVE');

  // A trial is active if there is NO active paid subscription but trial days are > 0
  // OR if the subscription status specifically says 'TRIAL' (if backend supports that)
  // based on current backend logic, subscription=null usually implies trial or expired.
  // The API returns `trialDaysRemaining` explicitly.
  const isTrialActive = !hasActiveSubscription && trialDaysRemaining > 0;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        trialDaysRemaining,
        trialEndsAt,
        refreshSubscription,
        hasActiveSubscription,
        isTrialActive,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
