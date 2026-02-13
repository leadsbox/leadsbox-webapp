import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Sparkles, Zap } from 'lucide-react';
import {
  defaultSetupMetrics,
  fetchSetupMetrics,
  hasReachedFirstValue,
  trackFunnelMilestones,
  trackWeeklyFunnelSnapshot,
  type SetupMetrics,
} from './setupProgress';

const SetupWizardPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SetupMetrics>(defaultSetupMetrics);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const nextMetrics = await fetchSetupMetrics();
        setMetrics(nextMetrics);
        trackFunnelMilestones(nextMetrics);
        trackWeeklyFunnelSnapshot(nextMetrics);
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
        title: 'Connect a messaging channel',
        description: 'Connect WhatsApp or Instagram so customer chats enter LeadsBox automatically.',
        href: '/dashboard/settings?tab=integrations',
        cta: metrics.channelConnected ? 'Manage channels' : 'Connect channel',
        completed: metrics.channelConnected,
      },
      {
        id: 'first-lead',
        title: 'Capture your first lead',
        description: 'Import or create at least one lead so AI can start tracking progress.',
        href: '/dashboard/leads',
        cta: 'Open leads',
        completed: metrics.leadsCount > 0,
      },
      {
        id: 'first-sale',
        title: 'Record first paid sale',
        description: 'Use quick capture or invoice payment once to confirm your revenue workflow.',
        href: '/dashboard/sales',
        cta: 'Go to sales',
        completed: metrics.paidSalesCount > 0,
      },
    ],
    [metrics.channelConnected, metrics.leadsCount, metrics.paidSalesCount]
  );

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => !step.completed) || null;

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
            <p className='text-muted-foreground'>Connected channels</p>
            <p className='text-xl font-semibold'>{metrics.connectedChannels.length}</p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-muted-foreground'>Leads</p>
            <p className='text-xl font-semibold'>{metrics.leadsCount}</p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-muted-foreground'>Paid sales</p>
            <p className='text-xl font-semibold'>{metrics.paidSalesCount}</p>
          </div>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-muted-foreground'>First-value status</p>
            <p className='text-xl font-semibold'>{hasReachedFirstValue(metrics) ? 'Done' : 'In progress'}</p>
          </div>
        </CardContent>
      </Card>

      {metrics.connectedChannels.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {metrics.connectedChannels.map((channel) => (
            <Badge key={channel} variant='outline' className='capitalize'>
              {channel} connected
            </Badge>
          ))}
        </div>
      )}

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
                <Button
                  asChild
                  size='sm'
                  variant={step.completed ? 'secondary' : step.id === nextStep?.id ? 'default' : 'outline'}
                >
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
            <span>Stay focused: finish the next incomplete setup step before switching screens.</span>
          </div>
          <div className='flex gap-2'>
            <Button asChild size='sm'>
              <Link to={nextStep?.href || '/dashboard/home'}>
                <Zap className='mr-1 h-4 w-4' />
                {nextStep ? nextStep.cta : 'Open dashboard'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupWizardPage;
