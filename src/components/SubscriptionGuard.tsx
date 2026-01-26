import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { loading, hasActiveSubscription, isTrialActive } = useSubscription();
  const location = useLocation();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto' />
          <p className='text-muted-foreground'>Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Allowed if:
  // 1. Has an active paid subscription
  // 2. OR is in a valid trial period
  if (hasActiveSubscription || isTrialActive) {
    return <>{children}</>;
  }

  // Otherwise, redirect to billing
  // Store the attempted URL to redirect back after payment (optional improvement)
  return <Navigate to='/dashboard/billing' state={{ from: location }} replace />;
};

export default SubscriptionGuard;
