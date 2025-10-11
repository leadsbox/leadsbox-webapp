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

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await client.get(endpoints.billing.plans);
        const list: BillingPlan[] = response?.data?.data?.plans || response?.data?.plans || [];
        setPlans(list);
      } catch (error: any) {
        console.error('Failed to load billing plans:', error);
        toast({
          title: 'Unable to load plans',
          description: error?.response?.data?.message || 'Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
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
            <p className='text-muted-foreground mt-1'>
              Scale from solo to full team with realtime inboxes, automations, and analytics powered by LeadsBox.
            </p>
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

            return (
              <motion.div
                key={plan.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Card className='h-full flex flex-col border-primary/10 hover:border-primary transition-colors shadow-sm hover:shadow-lg'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-xl font-semibold'>{plan.name}</CardTitle>
                      {plan.trialPeriodDays ? (
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
                      disabled={initializingPlanId === plan.id}
                    >
                      {initializingPlanId === plan.id ? 'Opening Paystack…' : 'Choose Plan'}
                    </Button>
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
