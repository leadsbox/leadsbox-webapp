import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Receipt, Users, TrendingUp, MessageSquare, CheckSquare, Calendar, DollarSign, Activity, Globe, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { mockAnalytics, getTodayTasks, getOverdueTasks, mockLeads, mockOrganization } from '@/data/mockData';
import { IntegrationBadge } from '@/components/ui/integrationbadge';
import client from '@/api/client';
import { API_BASE, endpoints } from '@/api/config';
import { useSocketIO } from '@/lib/socket';
import { Thread } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Types for backend data
interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface BackendLead {
  id: string;
  conversationId?: string;
  providerId?: string;
  provider?: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

const quickActions = [
  {
    title: 'Create Invoice',
    description: 'Generate a new invoice',
    icon: FileText,
    color: 'bg-blue-500 hover:bg-blue-600',
    href: '/dashboard/invoices/new',
  },
  {
    title: 'Add Receipt',
    description: 'Record a payment receipt',
    icon: Receipt,
    color: 'bg-green-500 hover:bg-green-600',
    href: '/dashboard/receipts/new',
  },
  {
    title: 'New Lead',
    description: 'Add a new potential customer',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
    href: '/dashboard/leads/new',
  },
];

const chartConfig = {
  leads: {
    label: 'Leads',
    color: 'hsl(var(--primary))',
  },
  conversions: {
    label: 'Conversions',
    color: 'hsl(var(--secondary))',
  },
};

export default function DashboardHomePage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [actualLeadsCount, setActualLeadsCount] = useState(0);
  const [actualThreadsCount, setActualThreadsCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);
  const [leadsOverTimeData, setLeadsOverTimeData] = useState<ChartDataPoint[]>([]);
  const [pipelineData, setPipelineData] = useState<ChartDataPoint[]>([]);
  const [recentLeadsData, setRecentLeadsData] = useState<BackendLead[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Socket.IO integration for real-time updates
  const { socket, isConnected } = useSocketIO();

  const analytics = mockAnalytics;
  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const recentLeads = mockLeads.slice(0, 3);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const apiRoot = useMemo(() => API_BASE.replace(/\/api\/?$/, ''), []);

  // Helper function to refresh dashboard data (memoized to avoid dependency issues)
  const fetchDashboardData = React.useCallback(async () => {
    try {
      setAnalyticsLoading(true);

      // Fetch leads data for processing
      const leadsResp = await client.get(endpoints.leads);
      const leadsList: BackendLead[] = leadsResp?.data?.data?.leads || leadsResp?.data || [];

      // Process leads over time data (group by date)
      const leadsOverTime = processLeadsOverTime(leadsList);
      setLeadsOverTimeData(leadsOverTime);

      // Process pipeline data (group by stage/label)
      const pipelineDistribution = processPipelineData(leadsList);
      setPipelineData(pipelineDistribution);

      // Get recent leads (last 5, sorted by creation date)
      const recentLeads = leadsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
      setRecentLeadsData(recentLeads);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to empty arrays
      setLeadsOverTimeData([]);
      setPipelineData([]);
      setRecentLeadsData([]);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Helper function to process leads over time data
  const processLeadsOverTime = (leads: BackendLead[]): ChartDataPoint[] => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const leadsByDate = leads.reduce((acc, lead) => {
      const date = new Date(lead.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: leadsByDate[date] || 0,
    }));
  };

  // Helper function to process pipeline data
  const processPipelineData = (leads: BackendLead[]): ChartDataPoint[] => {
    const stageMap: Record<string, string> = {
      NEW: 'New',
      QUALIFIED: 'Qualified',
      CUSTOMER: 'Customer',
      CONTACTED: 'Contacted',
      UNQUALIFIED: 'Unqualified',
      LOST: 'Lost',
    };

    const leadsByStage = leads.reduce((acc, lead) => {
      const stage = lead.label?.toUpperCase() || 'NEW';
      const stageKey = stageMap[stage] || 'Other';
      acc[stageKey] = (acc[stageKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(leadsByStage).map(([stage, count]) => ({
      date: stage,
      value: count,
      label: stage,
    }));
  };

  // Check WhatsApp and Telegram connection status
  useEffect(() => {
    const checkIntegrationStatus = async () => {
      try {
        setIntegrationLoading(true);

        // Check WhatsApp status
        try {
          const whatsappResp = await client.get(`${apiRoot}/api/provider/whatsapp/status`);
          const whatsappPayload = whatsappResp?.data?.data || {};
          setWhatsappConnected(!!whatsappPayload?.connected);
        } catch (error) {
          console.error('Failed to check WhatsApp status:', error);
          setWhatsappConnected(false);
        }

        // Check Telegram status (using mock for now since endpoint may not exist)
        // TODO: Replace with actual Telegram status endpoint when available
        setTelegramConnected(!!mockOrganization?.settings?.integrations?.telegram?.botToken);
      } catch (error) {
        console.error('Error checking integration status:', error);
      } finally {
        setIntegrationLoading(false);
      }
    };

    checkIntegrationStatus();
  }, [apiRoot]);

  // Fetch actual leads and threads counts
  useEffect(() => {
    const fetchActualCounts = async () => {
      try {
        setCountsLoading(true);

        // Fetch leads count
        try {
          const leadsResp = await client.get('/leads');
          const leadsList = leadsResp?.data?.data?.leads || leadsResp?.data || [];
          setActualLeadsCount(leadsList.length);
        } catch (error) {
          console.error('Failed to fetch leads count:', error);
          setActualLeadsCount(0);
        }

        // Fetch threads count
        try {
          const threadsResp = await client.get('/threads');
          const threadsList = threadsResp?.data?.data?.threads || threadsResp?.data || [];
          setActualThreadsCount(threadsList.length);
        } catch (error) {
          console.error('Failed to fetch threads count:', error);
          setActualThreadsCount(0);
        }
      } catch (error) {
        console.error('Error fetching actual counts:', error);
      } finally {
        setCountsLoading(false);
      }
    };

    fetchActualCounts();
  }, []);

  // Fetch analytics and dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setAnalyticsLoading(true);

        // Fetch leads data for processing
        const leadsResp = await client.get(endpoints.leads);
        const leadsList: BackendLead[] = leadsResp?.data?.data?.leads || leadsResp?.data || [];

        // Process leads over time data (group by date)
        const leadsOverTime = processLeadsOverTime(leadsList);
        setLeadsOverTimeData(leadsOverTime);

        // Process pipeline data (group by stage/label)
        const pipelineDistribution = processPipelineData(leadsList);
        setPipelineData(pipelineDistribution);

        // Get recent leads (last 5, sorted by creation date)
        const recentLeads = leadsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
        setRecentLeadsData(recentLeads);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to empty arrays
        setLeadsOverTimeData([]);
        setPipelineData([]);
        setRecentLeadsData([]);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Real-time Socket.IO event listeners for instant dashboard updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle new leads - update counts and recent leads instantly
    const handleNewLead = (data: { lead: BackendLead }) => {
      setActualLeadsCount((prev) => prev + 1);

      // Add to recent leads list (remove oldest if > 5)
      setRecentLeadsData((prev) => {
        const updated = [data.lead, ...prev];
        return updated.slice(0, 5);
      });

      // Refresh charts data to include new lead
      fetchDashboardData();
    };

    // Handle lead updates - refresh recent leads and charts
    const handleLeadUpdate = (data: { lead: BackendLead }) => {
      setRecentLeadsData((prev) => prev.map((lead) => (lead.id === data.lead.id ? data.lead : lead)));

      // Refresh charts data for updated pipeline stages
      fetchDashboardData();
    };

    // Handle new threads - update thread count instantly
    const handleNewThread = (data: { thread: Thread }) => {
      setActualThreadsCount((prev) => prev + 1);
    };

    // Handle dashboard stats broadcasts (if backend sends aggregated stats)
    const handleDashboardStats = (data: { totalLeads: number; activeThreads: number; [key: string]: unknown }) => {
      if (data.totalLeads !== undefined) setActualLeadsCount(data.totalLeads);
      if (data.activeThreads !== undefined) setActualThreadsCount(data.activeThreads);
    };

    // Subscribe to real-time events and get unsubscribe functions
    const unsubscribeNewLead = socket.on('lead:new', handleNewLead);
    const unsubscribeLeadUpdate = socket.on('lead:updated', handleLeadUpdate);
    const unsubscribeNewThread = socket.on('thread:new', handleNewThread);
    const unsubscribeDashboardStats = socket.on('dashboard:stats', handleDashboardStats);

    // Cleanup listeners on unmount
    return () => {
      unsubscribeNewLead();
      unsubscribeLeadUpdate();
      unsubscribeNewThread();
      unsubscribeDashboardStats();
    };
  }, [socket, isConnected, fetchDashboardData]);

  const overviewSkeleton = (
    <div className='grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`home-overview-skel-${index}`} className='h-full'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-4 rounded-full' />
          </CardHeader>
          <CardContent className='space-y-3'>
            <Skeleton className='h-7 w-16' />
            <Skeleton className='h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const chartSkeleton = (
    <div className='h-[160px] sm:h-[200px] flex items-center justify-center'>
      <Skeleton className='h-full w-full rounded-md' />
    </div>
  );

  const recentLeadsSkeleton = (
    <div className='space-y-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`recent-lead-skel-${index}`} className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-3 w-20' />
          </div>
          <div className='space-y-2 text-right'>
            <Skeleton className='h-5 w-14 rounded-full' />
            <Skeleton className='h-3 w-16' />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Home</h1>
              <p className='text-sm sm:text-base text-muted-foreground'>Welcome back! Here's what's happening with your business.</p>
            </div>

            {/* Real-time Connection Status */}
            <div className='flex items-center gap-2 px-3 py-1 rounded-full text-xs border'>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className={isConnected ? 'text-green-700' : 'text-gray-500'}>{isConnected ? '⚡ Real-time' : 'Offline'}</span>
            </div>
          </div>

          <div className='mt-2 flex items-center gap-2'>
            <IntegrationBadge
              icon={Globe}
              label='WhatsApp'
              connected={whatsappConnected}
              loading={integrationLoading}
              to='/dashboard/settings?tab=integrations'
            />
            <IntegrationBadge
              icon={Send}
              label='Telegram'
              connected={telegramConnected}
              loading={integrationLoading}
              to='/dashboard/settings?tab=integrations'
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className='flex flex-wrap gap-2'>
          {quickActions.map((action) => (
            <Button
              key={action.title}
              asChild
              aria-label={action.title}
              className={`${action.color} text-white border-0 hover:shadow-lg transition-all duration-200`}
            >
              <Link to={action.href} className='flex items-center gap-2'>
                <action.icon className='h-4 w-4' />
                <span className='hidden sm:inline'>{action.title}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {countsLoading && analyticsLoading ? (
        overviewSkeleton
      ) : (
        <div className='grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='transition-all duration-200 hover:shadow-md'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Leads</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{countsLoading ? '—' : actualLeadsCount}</div>
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <TrendingUp className='h-3 w-3 text-green-500' />
                <span className='text-green-500'>+12.5%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className='transition-all duration-200 hover:shadow-md'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active Threads</CardTitle>
              <MessageSquare className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{countsLoading ? '—' : actualThreadsCount}</div>
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Activity className='h-3 w-3 text-blue-500' />
                <span className='text-blue-500'>+3</span>
                <span>new today</span>
              </div>
            </CardContent>
          </Card>

          <Card className='transition-all duration-200 hover:shadow-md'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Conversion Rate</CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatPercentage(analytics.overview.conversionRate)}</div>
              <Progress value={analytics.overview.conversionRate} className='mt-2' />
            </CardContent>
          </Card>

          <Card className='transition-all duration-200 hover:shadow-md'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Avg Response Time</CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{analytics.overview.avgResponseTime}h</div>
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <TrendingUp className='h-3 w-3 text-green-500 rotate-180' />
                <span className='text-green-500'>-0.3h</span>
                <span>improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Recent Activity */}
      <div className='grid gap-4 sm:gap-6 lg:grid-cols-2'>
        {/* Leads Over Time Chart */}
        <Card className='transition-all duration-200 hover:shadow-md'>
          <CardHeader>
            <CardTitle>Leads Over Time</CardTitle>
            <CardDescription>Daily lead generation for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              chartSkeleton
            ) : (
              <ChartContainer config={chartConfig} className='h-[160px] sm:h-[200px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={leadsOverTimeData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='date' />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type='monotone' dataKey='value' stroke='hsl(var(--primary))' fill='hsl(var(--primary))' fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Stage Distribution */}
        <Card className='transition-all duration-200 hover:shadow-md'>
          <CardHeader>
            <CardTitle>Pipeline Distribution</CardTitle>
            <CardDescription>Leads by stage</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              chartSkeleton
            ) : (
              <ChartContainer config={chartConfig} className='h-[160px] sm:h-[200px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='date' />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey='value' fill='hsl(var(--primary))' />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Tasks */}
      <div className='grid gap-4 sm:gap-6 lg:grid-cols-3'>
        {/* Recent Leads */}
        <Card className='transition-all duration-200 hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-lg'>Recent Leads</CardTitle>
            <Button asChild variant='outline' size='sm'>
              <Link to='/dashboard/leads'>View All</Link>
            </Button>
          </CardHeader>
          <CardContent className='space-y-4'>
            {analyticsLoading ? (
              recentLeadsSkeleton
            ) : recentLeadsData.length === 0 ? (
              <div className='text-center py-4'>
                <div className='text-muted-foreground'>No recent leads found</div>
              </div>
            ) : (
              recentLeadsData.map((lead) => {
                const leadName = lead.providerId ? `Lead ${String(lead.providerId).slice(0, 6)}` : lead.conversationId || 'Lead';
                const leadStage = lead.label?.toUpperCase() || 'NEW';
                const provider = lead.provider || 'manual';

                return (
                  <div key={lead.id} className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='font-medium'>{leadName}</div>
                      <div className='text-sm text-muted-foreground capitalize'>
                        {provider} • {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className='text-right'>
                      <Badge
                        variant={
                          leadStage === 'NEW'
                            ? 'default'
                            : leadStage === 'QUALIFIED'
                            ? 'secondary'
                            : leadStage === 'CUSTOMER'
                            ? 'default'
                            : leadStage === 'CONTACTED'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {leadStage}
                      </Badge>
                      <div className='text-sm text-muted-foreground mt-1'>
                        {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className='transition-all duration-200 hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-lg'>Today's Tasks</CardTitle>
            <Button asChild variant='outline' size='sm'>
              <Link to='/dashboard/tasks'>View All</Link>
            </Button>
          </CardHeader>
          <CardContent className='space-y-4'>
            {todayTasks.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>No tasks scheduled for today</p>
            ) : (
              todayTasks.slice(0, 3).map((task) => (
                <div key={task.id} className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='font-medium'>{task.title}</div>
                    <div className='text-sm text-muted-foreground'>{task.type}</div>
                  </div>
                  <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className='transition-all duration-200 hover:shadow-md'>
          <CardHeader>
            <CardTitle className='text-lg'>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <CheckSquare className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>Tasks Due Today</span>
              </div>
              <Badge variant='outline'>{todayTasks.length}</Badge>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-destructive' />
                <span className='text-sm'>Overdue Tasks</span>
              </div>
              <Badge variant='destructive'>{overdueTasks.length}</Badge>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>Total Leads</span>
              </div>
              <div className='text-sm font-medium'>{countsLoading ? '...' : actualLeadsCount}</div>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <MessageSquare className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>Active Threads</span>
              </div>
              <div className='text-sm font-medium'>{countsLoading ? '...' : actualThreadsCount}</div>
            </div>

            <div className='pt-2'>
              <Button asChild className='w-full' variant='outline'>
                <Link to='/dashboard/analytics'>
                  <TrendingUp className='h-4 w-4 mr-2' />
                  View Detailed Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
