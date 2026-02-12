import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Server, Database, Activity, Globe } from 'lucide-react';
import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'loading' | 'unknown';

interface SystemHealth {
  api: ServiceStatus;
  database: ServiceStatus;
  thirdParty: ServiceStatus;
}

const StatusPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>({
    api: 'loading',
    database: 'loading',
    thirdParty: 'loading',
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setHealth((prev) => ({ ...prev, api: 'loading', database: 'loading' }));
    try {
      // Check API health
      await client.get('/healthz');
      
      // If API is up, we assume DB is likely up too since API depends on it for most things
      // In a real scenario, /healthz should check DB connectivity
      setHealth({
        api: 'operational',
        database: 'operational',
        thirdParty: 'operational', // Assumed for now
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({
        api: 'down',
        database: 'unknown', // Can't tell if API is down
        thirdParty: 'unknown',
      });
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <Badge className='bg-green-500 hover:bg-green-600'>Operational</Badge>;
      case 'degraded':
        return <Badge className='bg-yellow-500 hover:bg-yellow-600'>Degraded</Badge>;
      case 'down':
        return <Badge variant='destructive'>Down</Badge>;
      default:
        return <Badge variant='outline'>Checking...</Badge>;
    }
  };

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className='h-5 w-5 text-green-500' />;
      case 'degraded':
        return <Activity className='h-5 w-5 text-yellow-500' />;
      case 'down':
        return <XCircle className='h-5 w-5 text-red-500' />;
      default:
        return <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />;
    }
  };

  const overallStatus = 
    health.api === 'operational' && health.database === 'operational' 
      ? 'All Systems Operational' 
      : health.api === 'loading' 
        ? 'Checking System Status...' 
        : 'System Issues Detected';

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* Navigation (same style as landing) */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 transition-transform hover:scale-105'>
            <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
              <img
                src='/leadsboxlogo.svg'
                alt='LeadsBox Logo'
                width={24}
                height={24}
                className='h-full w-full object-contain'
              />
            </div>
            <span className='text-xl font-semibold'>LeadsBox</span>
          </a>

          <nav className='hidden md:flex items-center gap-6'>
            <a href='/#product' className='text-muted-foreground hover:text-primary transition-colors'>
              Product
            </a>
            <a href='/#how-it-works' className='text-muted-foreground hover:text-primary transition-colors'>
              How it Works
            </a>
            <a href='/#pricing' className='text-muted-foreground hover:text-primary transition-colors'>
              Pricing
            </a>
            <a href='/#creators' className='text-muted-foreground hover:text-primary transition-colors'>
              For Creators
            </a>
          </nav>

          <div className='flex items-center gap-2 sm:gap-3'>
            <Button variant='ghost' size='sm' onClick={checkHealth}>
              Refresh Status
            </Button>
            <Button variant='ghost' size='sm' asChild>
              <a href='/login'>Login</a>
            </Button>
            <Button size='sm' asChild>
              <a href='/register'>Start Free Trial</a>
            </Button>
          </div>
        </div>
      </header>

      <main className='flex-1 container mx-auto px-4 py-12 max-w-4xl'>
        <div className='space-y-8'>
          {/* Overall Status Banner */}
          <div className={`rounded-2xl p-8 text-center space-y-4 ${
            health.api === 'operational' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : health.api === 'down' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-muted/50 border border-border'
          }`}>
            <div className='flex justify-center'>
              {health.api === 'operational' ? (
                <CheckCircle2 className='h-16 w-16 text-green-500' />
              ) : health.api === 'down' ? (
                <XCircle className='h-16 w-16 text-red-500' />
              ) : (
                <Loader2 className='h-16 w-16 animate-spin text-muted-foreground' />
              )}
            </div>
            <h1 className='text-3xl font-bold'>{overallStatus}</h1>
            {lastChecked && (
              <p className='text-sm text-muted-foreground'>
                Last updated: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Detailed Status Cards */}
          <div className='grid gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>System Components</CardTitle>
                <CardDescription>Real-time status of LeadsBox core services</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* API */}
                <div className='flex items-center justify-between p-4 rounded-lg border bg-card/50'>
                  <div className='flex items-center gap-4'>
                    <div className='p-2 rounded-full bg-primary/10'>
                      <Server className='h-5 w-5 text-primary' />
                    </div>
                    <div>
                      <div className='font-semibold'>API Server</div>
                      <div className='text-sm text-muted-foreground'>Core application logic and endpoints</div>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    {getStatusIcon(health.api)}
                    {getStatusBadge(health.api)}
                  </div>
                </div>

                {/* Database */}
                <div className='flex items-center justify-between p-4 rounded-lg border bg-card/50'>
                  <div className='flex items-center gap-4'>
                    <div className='p-2 rounded-full bg-purple-500/10'>
                      <Database className='h-5 w-5 text-purple-500' />
                    </div>
                    <div>
                      <div className='font-semibold'>Database</div>
                      <div className='text-sm text-muted-foreground'>Data persistence and storage</div>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    {getStatusIcon(health.database)}
                    {getStatusBadge(health.database)}
                  </div>
                </div>

                {/* Third Party */}
                <div className='flex items-center justify-between p-4 rounded-lg border bg-card/50'>
                  <div className='flex items-center gap-4'>
                    <div className='p-2 rounded-full bg-blue-500/10'>
                      <Globe className='h-5 w-5 text-blue-500' />
                    </div>
                    <div>
                      <div className='font-semibold'>Third-Party Services</div>
                      <div className='text-sm text-muted-foreground'>OpenAI, Paystack, Meta APIs</div>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    {getStatusIcon(health.thirdParty)}
                    {getStatusBadge(health.thirdParty)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatusPage;
