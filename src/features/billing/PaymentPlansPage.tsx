import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, Loader2, ChevronDown } from 'lucide-react';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/toast';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

type BillingPlan = {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  interval: string;
  trialPeriodDays?: number | null;
  features?: {
    seats?: number;
    features?: string[];
  };
};

type SubscriptionSummary = {
  id: string;
  status: string;
  plan?: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
  } | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  reference?: string | null;
  cancelAtPeriodEnd?: boolean | null;
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);

const PaymentPlansPage: React.FC = () => {
  const [plans, setPlans] = React.useState<BillingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [initializingPlanId, setInitializingPlanId] = React.useState<string | null>(null);
  const [changingPlanId, setChangingPlanId] = React.useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState<'immediate' | 'period' | null>(null);
  const [subscription, setSubscription] = React.useState<SubscriptionSummary | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = React.useState<number>(14);
  const [trialEndsAt, setTrialEndsAt] = React.useState<string | null>(null);

  const fetchBillingData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [plansResp, subscriptionResp] = await Promise.all([
        client.get(endpoints.billing.plans),
        client.get(endpoints.billing.subscription).catch(() => null),
      ]);

      const list: BillingPlan[] = plansResp?.data?.data?.plans || plansResp?.data?.plans || [];
      setPlans(list);

      if (subscriptionResp?.data) {
        const payload = subscriptionResp.data.data || subscriptionResp.data;
        setSubscription(payload?.subscription ?? null);
        if (typeof payload?.trialDaysRemaining === 'number') {
          setTrialDaysRemaining(payload.trialDaysRemaining);
        }
        if (typeof payload?.trialEndsAt === 'string') {
          setTrialEndsAt(payload.trialEndsAt);
        }
      } else {
        setSubscription(null);
      }
    } catch (error: unknown) {
      console.error('Failed to load billing data:', error);
      const message = (error as ApiError)?.response?.data?.message || 'Please try again later.';
      notify.error({
        key: 'billing:load-failed',
        title: 'Billing unavailable',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const handleCancelSubscription = async (cancelImmediately: boolean) => {
    try {
      setCancelLoading(cancelImmediately ? 'immediate' : 'period');
      await client.post(endpoints.billing.cancelSubscription, {
        cancelImmediately,
      });
      notify.success({
        key: cancelImmediately ? 'billing:cancel-now' : 'billing:cancel-period',
        title: cancelImmediately ? 'Subscription canceled' : 'Auto-renew disabled',
        description: cancelImmediately ? 'Access ends immediately.' : 'Your plan will expire at the end of this period.',
      });
      await fetchBillingData();
    } catch (error: unknown) {
      console.error('Failed to cancel subscription:', error);
      notify.error({
        key: 'billing:cancel-error',
        title: 'Unable to update subscription',
        description: (error as ApiError)?.response?.data?.message || 'Please try again later.',
      });
    } finally {
      setCancelLoading(null);
    }
  };

  const handleChangePlan = async (plan: BillingPlan) => {
    try {
      setChangingPlanId(plan.id);
      const response = await client.post(endpoints.billing.changePlan, {
        planId: plan.id,
        cancelCurrent: true,
      });
      const payload = response?.data?.data || response?.data;
      if (payload?.authorizationUrl || payload?.authorization_url) {
        const url = payload.authorizationUrl || payload.authorization_url;
        window.open(url, '_blank', 'noopener noreferrer');
        notify.info({
          key: `billing:change:${plan.id}`,
          title: 'Checkout ready',
          description: `Complete Paystack checkout for the ${plan.name} plan.`,
          action: {
            label: 'Open Paystack',
            onClick: () => window.open(url, '_blank', 'noopener noreferrer'),
          },
        });
      } else {
        throw new Error('Missing authorization URL in response.');
      }
      await fetchBillingData();
    } catch (error: unknown) {
      console.error('Failed to change plan:', error);
      const apiError = error as ApiError;
      notify.error({
        key: `billing:change-error:${plan.id}`,
        title: 'Unable to change plan',
        description: apiError?.response?.data?.message || apiError?.message || 'Please try again later.',
      });
    } finally {
      setChangingPlanId(null);
    }
  };

  const handleChoosePlan = async (plan: BillingPlan) => {
    try {
      setInitializingPlanId(plan.id);
      const response = await client.post(endpoints.billing.initialize, {
        planId: plan.id,
      });
      const payload = response?.data?.data || response?.data;
      if (payload?.authorizationUrl || payload?.authorization_url) {
        const url = payload.authorizationUrl || payload.authorization_url;
        window.open(url, '_blank', 'noopener noreferrer');
        notify.info({
          key: `billing:init:${plan.id}`,
          title: 'Checkout ready',
          description: 'Complete your checkout in the new tab.',
          action: {
            label: 'Open Paystack',
            onClick: () => window.open(url, '_blank', 'noopener noreferrer'),
          },
        });
        const newTrialEndsAt = plan.trialPeriodDays ? new Date(Date.now() + plan.trialPeriodDays * 24 * 60 * 60 * 1000).toISOString() : trialEndsAt;
        if (typeof plan.trialPeriodDays === 'number') {
          setTrialDaysRemaining(plan.trialPeriodDays);
        }
        setTrialEndsAt(newTrialEndsAt ?? null);
        setSubscription({
          id: payload.reference,
          status: 'PENDING',
          plan: {
            id: plan.id,
            name: plan.name,
            amount: plan.amount,
            currency: plan.currency,
            interval: plan.interval,
          },
          trialEndsAt: newTrialEndsAt,
          reference: payload.reference,
        });
        await fetchBillingData();
      } else {
        throw new Error('Missing authorization URL in response.');
      }
    } catch (error: unknown) {
      console.error('Failed to initialize billing:', error);
      const apiError = error as ApiError;
      notify.error({
        key: `billing:init-error:${plan.id}`,
        title: 'Unable to start checkout',
        description: apiError?.response?.data?.message || apiError?.message || 'Please try again later.',
      });
    } finally {
      setInitializingPlanId(null);
    }
  };

  const renderSkeletons = () => (
    <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-8'>
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card key={`plan-skeleton-${idx}`}>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <div className='space-y-2'>
              {Array.from({ length: 3 }).map((__, featureIdx) => (
                <Skeleton key={featureIdx} className='h-3 w-2/3' />
              ))}
            </div>
            <Skeleton className='h-10 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const activePlanId = subscription?.plan?.id;
  const activeStatus = subscription?.status;
  const hasActiveSubscription = Boolean(subscription && !['CANCELED', 'EXPIRED'].includes((subscription.status || '').toUpperCase()));
  const formattedTrialEnds = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const formattedCurrentPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const isCancellationScheduled = Boolean(subscription?.cancelAtPeriodEnd);

  const heroSubtitle = (() => {
    if (subscription?.status === 'ACTIVE' && subscription.plan) {
      if (isCancellationScheduled) {
        const cancelLabel = formattedCurrentPeriodEnd || 'at the end of this period';
        return [`You're on the ${subscription.plan.name} plan`, `Cancels ${cancelLabel}`];
      }
      if (formattedCurrentPeriodEnd) {
        return `You're on the ${subscription.plan.name} plan • Next renewal ${formattedCurrentPeriodEnd}`;
      }
      return `You're on the ${subscription.plan.name} plan`;
    }

    if (subscription?.status === 'PAST_DUE' && subscription.plan) {
      return `Payment overdue for the ${subscription.plan.name} plan. Update billing to restore full access.`;
    }

    if (subscription?.status === 'PENDING' && subscription.plan) {
      return `Payment pending for the ${subscription.plan.name} plan. Complete Paystack checkout to activate.`;
    }

    if (subscription?.status === 'CANCELED' && subscription.plan) {
      return `Your ${subscription.plan.name} plan has been canceled. Choose a new plan to continue service.`;
    }

    if (trialDaysRemaining > 0) {
      const trialNote = formattedTrialEnds ? ` • Trial ends ${formattedTrialEnds}` : '';
      return `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in your free trial${trialNote}`;
    }

    return 'Your trial has ended. Pick a plan to keep LeadsBox running.';
  })();

  return (
    <div className='p-4 sm:p-6 space-y-6'>
      <motion.div
        className='rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className='flex items-start gap-4'>
          <div className='w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center'>
            <Sparkles className='h-6 w-6' />
          </div>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold'>Choose the perfect plan</h1>
          {Array.isArray(heroSubtitle) ? (
            <div className='text-muted-foreground mt-1 space-y-1 text-sm'>
              <p>{heroSubtitle[0]}</p>
              <p className='inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700'>
                {heroSubtitle[1]}
              </p>
            </div>
          ) : (
            <p className='text-muted-foreground mt-1'>{heroSubtitle}</p>
          )}
          </div>
        </div>
        <div className='flex items-center gap-3 text-sm text-muted-foreground'>
          <ShieldCheck className='h-5 w-5 text-primary' />
          <span>Secure Paystack checkout • Cancel anytime</span>
        </div>
      </motion.div>

      {loading ? (
        renderSkeletons()
      ) : (
        <motion.div
          className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'
          initial='hidden'
          animate='show'
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {plans.map((plan) => {
            const features = plan.features?.features ?? [];
            const seats = plan.features?.seats;
            const amountDisplay = formatCurrency(plan.amount, plan.currency);
            const intervalLabel =
              plan.interval === 'ANNUAL'
                ? 'per year'
                : plan.interval === 'MONTHLY'
                ? 'per month'
                : plan.interval === 'WEEKLY'
                ? 'per week'
                : 'per day';

            const isCurrentPlan = activePlanId === plan.id && activeStatus === 'ACTIVE';
            const isPendingPlan = activePlanId === plan.id && activeStatus === 'PENDING';
            const isPastDuePlan = activePlanId === plan.id && activeStatus === 'PAST_DUE';
            const isPlanLoading = initializingPlanId === plan.id || changingPlanId === plan.id;
            const disableBecausePending = subscription?.status === 'PENDING' && !isCurrentPlan;
            const canSwitch = hasActiveSubscription && !isCurrentPlan && subscription?.status !== 'PENDING';
            const buttonDisabled = isPlanLoading || isPendingPlan || disableBecausePending;

            let actionLabel = 'Choose plan';
            if (canSwitch) {
              actionLabel = `Switch to ${plan.name}`;
            }
            if (!hasActiveSubscription && plan.trialPeriodDays && !subscription) {
              actionLabel = 'Start free trial';
            }
            if (isPlanLoading) {
              actionLabel = 'Opening Paystack…';
            } else if (isPendingPlan) {
              actionLabel = 'Activation pending';
            }

            const planRenewalDate = isCurrentPlan && formattedCurrentPeriodEnd ? formattedCurrentPeriodEnd : null;
            const isCancellationScheduledForPlan = isCurrentPlan && isCancellationScheduled;

            return (
              <motion.div
                key={plan.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Card
                  className={cn(
                    'h-full flex flex-col border-primary/10 hover:border-primary transition-colors shadow-sm hover:shadow-lg',
                    isCurrentPlan ? 'border-primary bg-primary/5' : '',
                    isPendingPlan ? 'border-amber-300 bg-amber-50/40' : '',
                    isPastDuePlan ? 'border-destructive/50 bg-destructive/5' : ''
                  )}
                >
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center justify-between flex-wrap gap-2'>
                      <CardTitle className='text-xl font-semibold'>{plan.name}</CardTitle>
                      <div className='flex items-center gap-2 flex-wrap'>
                        {plan.trialPeriodDays ? (
                          <Badge variant='outline' className='border-primary/40 text-primary'>
                            {plan.trialPeriodDays}-day trial
                          </Badge>
                        ) : null}
                        {isCurrentPlan ? (
                          <Badge variant='secondary' className='bg-primary text-primary-foreground'>
                            Current plan
                          </Badge>
                        ) : null}
                        {isPendingPlan ? (
                          <Badge variant='outline' className='border-amber-400 text-amber-600 bg-amber-50'>
                            Pending activation
                          </Badge>
                        ) : null}
                        {isPastDuePlan ? (
                          <Badge variant='outline' className='border-destructive/50 text-destructive'>
                            Payment overdue
                          </Badge>
                        ) : null}
                      </div>
                      {isCancellationScheduledForPlan ? (
                        <div className='w-full'>
                          <Badge variant='outline' className='border-amber-400 text-amber-600 bg-amber-50 inline-flex'>
                            Cancels {planRenewalDate || 'this period'}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                    {plan.description ? <p className='text-sm text-muted-foreground'>{plan.description}</p> : null}
                  </CardHeader>
                  <CardContent className='flex-1 flex flex-col space-y-5'>
                    <div>
                      <div className='text-3xl font-bold'>{amountDisplay}</div>
                      <div className='text-sm text-muted-foreground'>{intervalLabel}</div>
                    </div>

                    {typeof seats === 'number' ? (
                      <div className='inline-flex items-center gap-2 rounded-md bg-primary/5 text-primary px-3 py-1 text-sm w-fit'>
                        <Zap className='h-4 w-4' />
                        <span>{seats} seats included</span>
                      </div>
                    ) : null}

                    <ul className='space-y-2 text-sm text-muted-foreground flex-1'>
                      {features.length ? (
                        features.map((feature, index) => (
                          <li key={index} className='flex items-start gap-2'>
                            <span className='mt-1 h-2 w-2 rounded-full bg-primary/70' />
                            <span>{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className='text-xs italic text-muted-foreground/80'>Feature breakdown coming soon.</li>
                      )}
                    </ul>

                    {isCurrentPlan ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' className='w-full justify-between' disabled={cancelLoading !== null}>
                            <span>Manage plan</span>
                            {cancelLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <ChevronDown className='h-4 w-4 opacity-60' />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='w-64'>
                          <DropdownMenuLabel>{plan.name}</DropdownMenuLabel>
                          {isCancellationScheduledForPlan ? (
                            <DropdownMenuItem disabled>Auto-renew already disabled</DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleCancelSubscription(false);
                                }}
                                disabled={cancelLoading !== null}
                              >
                                Cancel at end of period
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive'
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleCancelSubscription(true);
                                }}
                                disabled={cancelLoading !== null}
                              >
                                Cancel immediately
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>Need help? Contact support</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        className='w-full'
                        disabled={buttonDisabled}
                        onClick={() => {
                          if (buttonDisabled) return;
                          if (canSwitch) {
                            handleChangePlan(plan);
                          } else {
                            handleChoosePlan(plan);
                          }
                        }}
                      >
                        {isPlanLoading ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> {actionLabel}
                          </>
                        ) : (
                          actionLabel
                        )}
                      </Button>
                    )}

                    {isCurrentPlan && planRenewalDate && !isCancellationScheduledForPlan ? (
                      <p className='text-xs text-muted-foreground text-center mt-2'>Next renewal {planRenewalDate}</p>
                    ) : null}
                    {isCancellationScheduledForPlan ? (
                      <p className='text-xs text-amber-600 text-center mt-2'>
                        Subscription will terminate {planRenewalDate || 'at the end of this period'}.
                      </p>
                    ) : null}
                    {isPastDuePlan ? (
                      <p className='text-xs text-destructive text-center mt-2'>Payment overdue — update billing details to avoid disruption.</p>
                    ) : null}
                    {disableBecausePending && !isPendingPlan ? (
                      <p className='text-xs text-muted-foreground text-center mt-2'>Finish the pending checkout to make more changes.</p>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default PaymentPlansPage;
