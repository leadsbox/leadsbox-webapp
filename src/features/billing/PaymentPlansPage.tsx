import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);

const PaymentPlansPage: React.FC = () => {
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<BillingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [initializingPlanId, setInitializingPlanId] = React.useState<string | null>(null);
  const [subscription, setSubscription] = React.useState<SubscriptionSummary | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = React.useState<number>(14);
  const [trialEndsAt, setTrialEndsAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
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
        }
      } catch (error: any) {
        console.error('Failed to load billing data:', error);
        toast({
          title: 'Unable to load billing data',
          description: error?.response?.data?.message || 'Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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
        toast({
          title: 'Redirecting to Paystack',
          description: 'Complete your checkout in the new tab.',
        });
        const newTrialEndsAt = plan.trialPeriodDays
          ? new Date(Date.now() + plan.trialPeriodDays * 24 * 60 * 60 * 1000).toISOString()
          : trialEndsAt;
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
      } else {
        throw new Error('Missing authorization URL in response.');
      }
    } catch (error: any) {
      console.error('Failed to initialize billing:', error);
      toast({
        title: 'Unable to start checkout',
        description: error?.response?.data?.message || error?.message || 'Please try again later.',
        variant: 'destructive',
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

  const formattedTrialEnds = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  const heroSubtitle = activeStatus === 'ACTIVE' && subscription?.plan
    ? `You're on the ${subscription.plan.name} plan${formattedTrialEnds ? ` • Next renewal ${formattedTrialEnds}` : ''}`
    : trialDaysRemaining > 0
    ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in your free trial`
    : 'Your trial has ended. Pick a plan to keep LeadsBox running.';

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
            <p className='text-muted-foreground mt-1'>{heroSubtitle}</p>
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
            const buttonDisabled = initializingPlanId === plan.id || isCurrentPlan || isPendingPlan;
            const buttonLabel = isCurrentPlan
              ? 'Current plan'
              : isPendingPlan
              ? 'Activation pending'
              : initializingPlanId === plan.id
              ? 'Opening Paystack…'
              : 'Choose plan';

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
                    isPendingPlan ? 'border-amber-300 bg-amber-50/40' : ''
                  )}
                >
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-xl font-semibold'>{plan.name}</CardTitle>
                      {isCurrentPlan ? (
                        <Badge variant='secondary' className='bg-primary text-primary-foreground'>
                          Current plan
                        </Badge>
                      ) : isPendingPlan ? (
                        <Badge variant='outline' className='border-amber-400 text-amber-500'>
                          Pending activation
                        </Badge>
                      ) : plan.trialPeriodDays ? (
                        <Badge variant='outline' className='border-primary/40 text-primary'>
                          {plan.trialPeriodDays}-day trial
                        </Badge>
                      ) : null}
                    </div>
                    {plan.description ? (
                      <p className='text-sm text-muted-foreground'>{plan.description}</p>
                    ) : null}
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
                        <li className='text-xs italic text-muted-foreground/80'>
                          Feature breakdown coming soon.
                        </li>
                      )}
                    </ul>

                    <Button
                      className='w-full'
                      onClick={() => handleChoosePlan(plan)}
                      disabled={buttonDisabled}
                    >
                      {buttonLabel}
                    </Button>
                    {isCurrentPlan && subscription?.currentPeriodEnd ? (
                      <p className='text-xs text-muted-foreground text-center mt-2'>
                        Next renewal {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
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
