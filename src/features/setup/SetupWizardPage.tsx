import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, MessageSquare, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { salesApi } from '@/api/sales';

type SetupMetrics = {
  leadsCount: number;
  paidSalesCount: number;
  pendingAiReviews: number;
  followUpsCount: number;
};

const defaultMetrics: SetupMetrics = {
  leadsCount: 0,
  paidSalesCount: 0,
  pendingAiReviews: 0,
  followUpsCount: 0,
};

const SetupWizardPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SetupMetrics>(defaultMetrics);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leadsRes, paidSalesRes, reviewInboxRes, followUpsRes] = await Promise.all([
          client.get(endpoints.leads),
          salesApi.list({ status: 'PAID' }),
          salesApi.reviewInbox(1),
          client.get(endpoints.followups),
        ]);

        const leads = leadsRes?.data?.data?.leads || leadsRes?.data || [];
        const paidSales = paidSalesRes?.data?.sales || [];
        const pendingAiReviews = reviewInboxRes?.data?.summary?.pendingCount || 0;
        const followUps = followUpsRes?.data?.data?.followUps || followUpsRes?.data?.followUps || [];

        setMetrics({
          leadsCount: Array.isArray(leads) ? leads.length : 0,
          paidSalesCount: Array.isArray(paidSales) ? paidSales.length : 0,
          pendingAiReviews,
          followUpsCount: Array.isArray(followUps) ? followUps.length : 0,
        });
      } catch (error) {
        console.error('Failed to load setup wizard metrics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const steps = useMemo(
    () => [
      {
        id: 'connect-channel',
        title: 'Connect WhatsApp channel',
        description: 'Connect your messaging channel so chats start flowing into LeadsBox.',
        href: '/dashboard/settings?tab=integrations',
        cta: 'Connect channel',
        completed: false,
      },
      {
        id: 'first-lead',
        title: 'Capture your first lead',
        description: 'Import or create at least one lead to activate core sales workflows.',
        href: '/dashboard/leads',
        cta: 'Open leads',
        completed: metrics.leadsCount > 0,
      },
      {
        id: 'clear-ai-review',
        title: 'Clear AI decisions inbox',
        description: 'Approve or reject AI-detected sales so your pipeline stays trustworthy.',
        href: '/dashboard/sales',
        cta: 'Review AI decisions',
        completed: metrics.pendingAiReviews === 0,
      },
      {
        id: 'first-sale',
        title: 'Record first paid sale',
        description: 'Use quick capture or invoice payment to validate your revenue flow.',
        href: '/dashboard/sales',
        cta: 'Go to sales',
        completed: metrics.paidSalesCount > 0,
      },
      {
        id: 'follow-up',
        title: 'Schedule a follow-up',
        description: 'Set at least one follow-up so no active opportunity slips through.',
        href: '/dashboard/home',
        cta: 'Schedule follow-up',
        completed: metrics.followUpsCount > 0,
      },
    ],
    [metrics.followUpsCount, metrics.leadsCount, metrics.paidSalesCount, metrics.pendingAiReviews]
  );

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className='space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold sm:text-3xl'>Launch Setup Wizard</h1>
          <p className='text-sm text-muted-foreground'>
            Complete these steps to make LeadsBox automatic and reliable for your daily WhatsApp sales flow.
          </p>
        </div>
        <Badge variant='secondary'>{completedSteps}/{steps.length} complete</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
          <CardDescription>{progress}% complete</CardDescription>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-3 text-sm md:grid-cols-4'>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-muted-foreground'>Leads</p>
            <p className='text-xl font-semibold'>{metrics.leadsCount}</p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-muted-foreground'>Paid sales</p>
            <p className='text-xl font-semibold'>{metrics.paidSalesCount}</p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-muted-foreground'>AI pending</p>
            <p className='text-xl font-semibold'>{metrics.pendingAiReviews}</p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-muted-foreground'>Follow-ups</p>
            <p className='text-xl font-semibold'>{metrics.followUpsCount}</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className='h-20 w-full' />
          ))}
        </div>
      ) : (
        <div className='space-y-3'>
          {steps.map((step, index) => (
            <Card key={step.id}>
              <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-start gap-3'>
                  <div className='mt-0.5'>
                    {step.completed ? (
                      <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                    ) : (
                      <Circle className='h-5 w-5 text-muted-foreground' />
                    )}
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Step {index + 1}</p>
                    <p className='font-medium'>{step.title}</p>
                    <p className='text-sm text-muted-foreground'>{step.description}</p>
                  </div>
                </div>
                <Button asChild size='sm' variant={step.completed ? 'secondary' : 'default'}>
                  <Link to={step.href}>{step.completed ? 'Completed' : step.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className='border-primary/30 bg-primary/5'>
        <CardContent className='flex flex-col gap-2 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-4 w-4 text-primary' />
            <span>Need the fastest path? Start with Sales quick capture and AI Decisions Inbox.</span>
          </div>
          <div className='flex gap-2'>
            <Button asChild size='sm' variant='outline'>
              <Link to='/dashboard/inbox'>
                <MessageSquare className='mr-1 h-4 w-4' />
                Inbox
              </Link>
            </Button>
            <Button asChild size='sm' variant='outline'>
              <Link to='/dashboard/sales'>
                <ShoppingBag className='mr-1 h-4 w-4' />
                Sales
              </Link>
            </Button>
            <Button asChild size='sm'>
              <Link to='/dashboard/sales'>
                <Zap className='mr-1 h-4 w-4' />
                Quick capture
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupWizardPage;
