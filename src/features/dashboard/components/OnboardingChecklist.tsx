import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ExternalLink, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  icon: LucideIcon;
  completed: boolean;
  helperText?: string;
};

type OnboardingChecklistProps = {
  steps?: OnboardingStep[];
  className?: string;
};

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ steps, className }) => {
  const totalSteps = steps?.length ?? 0;
  const completedSteps = steps?.filter((step) => step.completed).length ?? 0;
  const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleCardClick = React.useCallback(() => {
    if (collapsed) {
      setCollapsed(false);
    }
  }, [collapsed]);

  const handleCardKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!collapsed) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setCollapsed(false);
      }
    },
    [collapsed]
  );

  const handleHeaderClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      toggleCollapse();
    },
    [toggleCollapse]
  );

  const handleHeaderKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        toggleCollapse();
      }
    },
    [toggleCollapse]
  );

  // Safety check: if steps is undefined or empty, don't render
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        'group border border-border border-solid transition-all duration-300 hover:-translate-y-0.5 hover:border-dashed hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        collapsed ? 'cursor-pointer' : 'cursor-default',
        className
      )}
      role={collapsed ? 'button' : 'region'}
      tabIndex={collapsed ? 0 : -1}
      aria-expanded={!collapsed}
      onClick={collapsed ? handleCardClick : undefined}
      onKeyDown={collapsed ? handleCardKeyDown : undefined}
    >
      <CardHeader
        className={cn(
          'pb-4 transition-colors duration-300 cursor-pointer select-none rounded-lg',
          collapsed ? 'group-hover:bg-primary/5 group-focus-visible:bg-primary/10' : 'hover:bg-primary/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
        tabIndex={collapsed ? -1 : 0}
        role={collapsed ? 'presentation' : 'button'}
        aria-expanded={!collapsed}
      >
        <div className='flex items-start justify-between gap-3'>
          <div>
            <CardTitle className='text-lg sm:text-xl font-semibold'>Get set up in minutes</CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>Follow these quick actions so your workspace is ready when new leads arrive.</p>
          </div>
          <Badge variant={completedSteps === totalSteps ? 'default' : 'outline'}>
            {completedSteps}/{totalSteps} done
          </Badge>
        </div>
        <div className='flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
          <Progress value={progress} />
          <div className='flex items-center justify-between gap-3'>
            <p className='text-xs text-muted-foreground'>You're {progress}% of the way there.</p>
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md',
                collapsed ? 'border border-primary/50 bg-primary/10 backdrop-blur-sm' : 'border border-primary/60 bg-primary/15 backdrop-blur-sm'
              )}
              aria-hidden='true'
            >
              <ChevronDown className={cn('h-5 w-5 transition-transform duration-300 text-primary', collapsed ? 'rotate-0' : 'rotate-180')} />
            </span>
          </div>
        </div>
      </CardHeader>
      {collapsed ? null : (
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            {steps.map((step) => {
              const StatusIcon = step.completed ? CheckCircle2 : Circle;
              return (
                <div
                  key={step.id}
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border bg-muted/40 p-3 transition hover:border-primary/40 hover:bg-muted/60'
                >
                  <div className='flex items-start gap-3'>
                    <div className='mt-0.5'>
                      <StatusIcon className={`h-5 w-5 ${step.completed ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <step.icon className='h-4 w-4 text-primary' />
                        <p className='text-sm font-medium leading-none'>{step.title}</p>
                      </div>
                      <p className='text-xs sm:text-sm text-muted-foreground'>{step.description}</p>
                      {step.helperText ? <p className='text-xs text-muted-foreground/80'>{step.helperText}</p> : null}
                    </div>
                  </div>
                  <div className='sm:self-start'>
                    <Button
                      asChild
                      size='sm'
                      variant={step.completed ? 'secondary' : 'default'}
                      className='w-full sm:w-auto'
                      disabled={step.completed}
                    >
                      <Link to={step.href} aria-label={step.title}>
                        {step.completed ? 'Completed' : step.ctaLabel}
                        {!step.completed ? <ExternalLink className='ml-1.5 h-4 w-4' /> : null}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {completedSteps === totalSteps ? (
            <div className='rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
              Nice work! Keep the momentum going by inviting teammates or creating automations.
            </div>
          ) : (
            <div className='rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary-foreground sm:text-sm'>
              Completing these steps helps LeadsBox personalize your dashboard and uncover opportunities faster.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default OnboardingChecklist;
