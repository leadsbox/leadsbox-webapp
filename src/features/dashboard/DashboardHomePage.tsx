import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FileText,
  Receipt,
  Users,
  TrendingUp,
  MessageSquare,
  CheckSquare,
  Calendar,
  DollarSign,
  Activity,
  Globe,
  Send,
  Clock,
  Briefcase,
  MailCheck,
  UploadCloud,
  PenSquare,
  Zap,
  Gift,
  Instagram,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { IntegrationBadge } from '@/components/ui/integrationbadge';
import client, { getOrgId } from '@/api/client';
import { endpoints } from '@/api/config';
import type { Analytics, Task } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/useAuth';
import { extractFollowUps } from '@/utils/apiData';
import { categoriseTasks, mapFollowUpsToTasks } from '@/features/tasks/taskUtils';
import OnboardingChecklist, { OnboardingStep } from './components/OnboardingChecklist';
import { getApiMonitoringSnapshot, subscribeApiMonitoringAlerts } from '@/lib/apiMonitoring';
import { trackAppEvent } from '@/lib/productTelemetry';
import FeedbackModal from '@/components/FeedbackModal';

// Custom WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className={className}>
    <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
  </svg>
);

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
  assignedTo?: string;
}

type OrganizationDetails = {
  id?: string;
  name?: string | null;
  settings?: {
    timezone?: string | null;
    currency?: string | null;
    profile?: {
      senderName?: string | null;
      senderEmail?: string | null;
    } | null;
    integrations?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

const DEFAULT_ANALYTICS_OVERVIEW = {
  totalLeads: 0,
  activeThreads: 0,
  conversionRate: 0,
  avgResponseTime: 0,
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

type ActivationFunnelStep = {
  id: string;
  label: string;
  count: number;
  conversionFromPreviousPct: number;
};

type ActivationDropOff = {
  from: string;
  to: string;
  lost: number;
  dropOffPct: number;
};

type ActivationFunnelSnapshot = {
  range: {
    days: number;
    from: string;
    to: string;
  };
  steps: ActivationFunnelStep[];
  dropOff: ActivationDropOff[];
  generatedAt: string;
};

const quickActions = [
  // {
  //   title: 'Create Invoice',
  //   description: 'Generate a new invoice',
  //   icon: FileText,
  //   color: 'bg-blue-500 hover:bg-blue-600',
  //   href: '/dashboard/invoices/new',
  // },
  // {
  //   title: 'Add Receipt',
  //   description: 'Record a payment receipt',
  //   icon: Receipt,
  //   color: 'bg-green-500 hover:bg-green-600',
  //   href: '/dashboard/receipts/new',
  // },
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
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [paymentConnected, setPaymentConnected] = useState(false);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [actualLeadsCount, setActualLeadsCount] = useState(0);
  const [actualThreadsCount, setActualThreadsCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);
  const [leadsOverTimeData, setLeadsOverTimeData] = useState<ChartDataPoint[]>([]);
  const [pipelineData, setPipelineData] = useState<ChartDataPoint[]>([]);
  const [recentLeadsData, setRecentLeadsData] = useState<BackendLead[]>([]);
  const [analyticsOverview, setAnalyticsOverview] = useState(DEFAULT_ANALYTICS_OVERVIEW);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isAnalyticsPending, setIsAnalyticsPending] = useState(true);
  const [isLeadsPending, setIsLeadsPending] = useState(true);
  const { user } = useAuth();
  const organizationId = user?.orgId || user?.currentOrgId || getOrgId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails | null>(null);
  const [templatesCount, setTemplatesCount] = useState<number | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [apiMonitoring, setApiMonitoring] = useState(() => getApiMonitoringSnapshot());
  const [pmfReportLoading, setPmfReportLoading] = useState(false);
  const [activationFunnel, setActivationFunnel] = useState<ActivationFunnelSnapshot | null>(null);
  const [activationFunnelLoading, setActivationFunnelLoading] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Beta banner state
  const [showBetaBanner, setShowBetaBanner] = useState(() => {
    return localStorage.getItem('lb_beta_banner_dismissed') !== 'true';
  });

  const dismissBetaBanner = () => {
    localStorage.setItem('lb_beta_banner_dismissed', 'true');
    setShowBetaBanner(false);
  };

  const taskBuckets = useMemo(() => categoriseTasks(tasks), [tasks]);
  const todayTasks = taskBuckets.today;
  const overdueTasks = taskBuckets.overdue;
  const upcomingTasks = taskBuckets.upcoming;
  const renderTaskMetric = (value: number): string | number => {
    if (tasksLoading) return '…';
    if (tasksError) return '—';
    return value;
  };

  const analyticsLoading = isAnalyticsPending || isLeadsPending;
  const reliabilityRows = useMemo(
    () => [
      {
        key: 'inbox_send',
        label: 'Inbox send',
        data: apiMonitoring.flows.inbox_send,
      },
      {
        key: 'sales_quick_capture',
        label: 'Quick capture',
        data: apiMonitoring.flows.sales_quick_capture,
      },
      {
        key: 'followup_schedule',
        label: 'Follow-up scheduling',
        data: apiMonitoring.flows.followup_schedule,
      },
    ],
    [apiMonitoring],
  );

  const getReliabilityStatus = (errorRate: number, p95Ms: number): 'healthy' | 'watch' | 'critical' => {
    if (errorRate >= 0.3 || p95Ms >= 5000) return 'critical';
    if (errorRate >= 0.15 || p95Ms >= 2500) return 'watch';
    return 'healthy';
  };

  const organizationProfileComplete = useMemo(() => {
    const isFilled = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
    const settings = organizationDetails?.settings as Record<string, unknown> | undefined;
    const timezone = settings?.timezone;
    const currency = settings?.currency;
    return [organizationDetails?.name, timezone, currency].every(isFilled);
  }, [organizationDetails]);

  const missingProfileFields = useMemo(() => {
    const isFilled = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
    const missing: string[] = [];
    if (!isFilled(organizationDetails?.name)) {
      missing.push('organization name');
    }
    const settings = organizationDetails?.settings as Record<string, unknown> | undefined;
    const timezone = settings?.timezone;
    const currency = settings?.currency;
    if (!isFilled(timezone)) {
      missing.push('timezone');
    }
    if (!isFilled(currency)) {
      missing.push('currency');
    }
    return missing;
  }, [organizationDetails]);

  const hasMessagingIntegration = whatsappConnected || instagramConnected;
  const hasLeads = actualLeadsCount > 0;
  const hasTemplates = (templatesCount ?? 0) > 0;
  const hasAutomations = tasks.length > 0;

  const onboardingSteps = useMemo<OnboardingStep[]>(() => {
    const profileHelper = !organizationProfileComplete && missingProfileFields.length ? `Missing: ${missingProfileFields.join(', ')}.` : undefined;

    return [
      {
        id: 'profile',
        title: 'Complete organization profile',
        description: 'Set your brand name, timezone, and currency.',
        href: '/dashboard/settings?tab=organization',
        ctaLabel: 'Open settings',
        icon: Briefcase,
        completed: organizationProfileComplete,
        helperText: profileHelper,
      },
      {
        id: 'integrations',
        title: 'Connect WhatsApp',
        description: 'Sync your primary channel so conversations flow straight into LeadsBox.',
        href: '/dashboard/settings?tab=integrations',
        ctaLabel: 'Connect now',
        icon: MailCheck,
        completed: whatsappConnected,
        helperText: whatsappConnected ? undefined : 'Start with the channel your customers use most.',
      },
      {
        id: 'leads',
        title: 'Capture your first lead',
        description: 'Add your first lead manually or from incoming messages to start your pipeline.',
        href: '/dashboard/leads?quickAdd=1',
        ctaLabel: 'Add lead',
        icon: Users,
        completed: hasLeads,
        helperText: hasLeads ? undefined : 'Even a single sample lead unlocks pipeline insights.',
      },
    ];
  }, [organizationProfileComplete, missingProfileFields, whatsappConnected, hasLeads]);

  const coreDataReady = !countsLoading && !analyticsLoading && !templatesLoading && !integrationLoading && !tasksLoading;
  const hasIncompleteSteps = onboardingSteps?.some((step) => !step.completed) ?? false;
  const showOnboardingChecklist = coreDataReady && hasIncompleteSteps && onboardingSteps;

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const PMF_REPORT_KEY = 'lb_last_pmf_weekly_report_at';

  const downloadPmfReport = React.useCallback(async (days = 7) => {
    setPmfReportLoading(true);
    try {
      const response = await client.get(endpoints.analytics.pmfWeekly(days));
      const report = response?.data?.data?.report || response?.data?.report || null;
      if (!report) {
        throw new Error('PMF report payload not available');
      }

      const generatedAt = new Date().toISOString().slice(0, 10);
      const filename = `pmf-weekly-report-${generatedAt}.json`;
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      localStorage.setItem(PMF_REPORT_KEY, String(Date.now()));
      trackAppEvent('pmf_weekly_report_downloaded', { days });
    } catch (error) {
      console.error('Failed to download PMF weekly report:', error);
    } finally {
      setPmfReportLoading(false);
    }
  }, []);

  // Helper function to refresh dashboard data (memoized to avoid dependency issues)
  const fetchDashboardData = React.useCallback(async () => {
    try {
      setIsLeadsPending(true);

      const leadsResp = await client.get(endpoints.leads);

      const rawLeads = leadsResp?.data?.data?.leads || leadsResp?.data;
      const leadsList: BackendLead[] = Array.isArray(rawLeads) ? rawLeads : [];

      const leadsOverTime = processLeadsOverTime(leadsList);
      setLeadsOverTimeData(leadsOverTime);

      const pipelineDistribution = processPipelineData(leadsList);
      setPipelineData(pipelineDistribution);

      const recentLeads = leadsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
      setRecentLeadsData(recentLeads);
      setActualLeadsCount(leadsList.length);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const apiError = error as ApiError;
      setAnalyticsError(apiError.response?.data?.message || 'Unable to load dashboard data.');
      setLeadsOverTimeData([]);
      setPipelineData([]);
      setRecentLeadsData([]);
    } finally {
      setIsLeadsPending(false);
    }
  }, []);

  const fetchTasks = React.useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);

    try {
      const response = await client.get(endpoints.followups);
      const followUps = extractFollowUps(response?.data);
      const mappedTasks = mapFollowUpsToTasks(followUps);
      // Filter tasks for current user only
      const userTasks = mappedTasks.filter((task) => task.assignedTo === user?.id);
      setTasks(userTasks);
    } catch (error) {
      console.error('Failed to fetch follow-ups for dashboard:', error);
      const apiError = error as ApiError;
      setTasksError(apiError.response?.data?.message || 'Unable to load follow-ups.');
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [user?.id]);

  const fetchAnalyticsOverview = React.useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (!background) {
        setIsAnalyticsPending(true);
      }
      setAnalyticsError(null);

      try {
        const response = await client.get(endpoints.analytics.overview(timeRange));
        const payload = response?.data?.data ?? {};
        const analyticsData = (payload.analytics ?? payload) as Analytics | null;
        const overview = analyticsData?.overview ?? DEFAULT_ANALYTICS_OVERVIEW;
        setAnalyticsOverview(overview);
        if (typeof overview.totalLeads === 'number') {
          setActualLeadsCount(overview.totalLeads);
        }
        if (typeof overview.activeThreads === 'number') {
          setActualThreadsCount(overview.activeThreads);
        }
      } catch (error) {
        console.error('Failed to fetch analytics overview:', error);
        const apiError = error as ApiError;
        setAnalyticsError(apiError.response?.data?.message || 'Unable to load analytics overview.');
        setAnalyticsOverview(DEFAULT_ANALYTICS_OVERVIEW);
      } finally {
        if (!background) {
          setIsAnalyticsPending(false);
        }
      }
    },
    [timeRange],
  );

  // Helper function to process leads over time data
  const processLeadsOverTime = (leads: BackendLead[]): ChartDataPoint[] => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const leadsByDate = leads.reduce(
      (acc, lead) => {
        const date = new Date(lead.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

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

    const leadsByStage = leads.reduce(
      (acc, lead) => {
        const stage = lead.label?.toUpperCase() || 'NEW';
        const stageKey = stageMap[stage] || 'Other';
        acc[stageKey] = (acc[stageKey] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(leadsByStage).map(([stage, count]) => ({
      date: stage,
      value: count,
      label: stage,
    }));
  };

  useEffect(() => {
    fetchAnalyticsOverview();
  }, [fetchAnalyticsOverview]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setApiMonitoring(getApiMonitoringSnapshot());
    const interval = window.setInterval(() => {
      setApiMonitoring(getApiMonitoringSnapshot());
    }, 30000);

    const unsubscribe = subscribeApiMonitoringAlerts(() => {
      setApiMonitoring(getApiMonitoringSnapshot());
    });

    return () => {
      window.clearInterval(interval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const lastGeneratedAt = Number(localStorage.getItem(PMF_REPORT_KEY) || 0);
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    if (Number.isFinite(lastGeneratedAt) && Date.now() - lastGeneratedAt < weekMs) {
      return;
    }

    (async () => {
      try {
        const response = await client.get(endpoints.analytics.pmfWeekly(7));
        const report = response?.data?.data?.report || response?.data?.report || null;
        if (!report) {
          return;
        }
        localStorage.setItem('lb_cached_pmf_weekly_report', JSON.stringify(report));
        localStorage.setItem(PMF_REPORT_KEY, String(Date.now()));
        trackAppEvent('pmf_weekly_report_cached');
      } catch {
        // Keep background automation best effort.
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setActivationFunnelLoading(true);
        const response = await client.get(endpoints.analytics.activationFunnel(30));
        const funnel = response?.data?.data?.funnel || response?.data?.funnel || null;
        if (!cancelled) {
          setActivationFunnel(funnel);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load activation funnel:', error);
          setActivationFunnel(null);
        }
      } finally {
        if (!cancelled) {
          setActivationFunnelLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fetchTemplatesCount = async () => {
      try {
        setTemplatesLoading(true);
        const response = await client.get(endpoints.templates.list);
        const rawData = (response?.data?.data ?? response?.data) as unknown;
        let nextCount = 0;

        if (Array.isArray(rawData)) {
          nextCount = rawData.length;
        } else if (rawData && typeof rawData === 'object') {
          const record = rawData as Record<string, unknown>;
          const templatesNode = record.templates;
          if (Array.isArray(templatesNode)) {
            nextCount = templatesNode.length;
          } else {
            const paginationNode = record.pagination as Record<string, unknown> | undefined;
            const paginationTotal = paginationNode?.total;
            const totalNode = record.total;
            if (typeof paginationTotal === 'number') {
              nextCount = paginationTotal;
            } else if (typeof totalNode === 'number') {
              nextCount = totalNode;
            }
          }
        }

        setTemplatesCount(nextCount);
      } catch (error) {
        console.error('Failed to load templates for onboarding:', error);
        setTemplatesCount(0);
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplatesCount();
  }, []);

  // Check WhatsApp and Telegram connection status
  useEffect(() => {
    const parseIntegrationFlag = (input: unknown): boolean => {
      if (typeof input === 'boolean') {
        return input;
      }
      if (!input || typeof input !== 'object') {
        return false;
      }
      const record = input as Record<string, unknown>;
      if (typeof record.connected === 'boolean') {
        return record.connected;
      }
      if (typeof record.enabled === 'boolean') {
        return record.enabled;
      }
      if (Array.isArray(record.connections)) {
        return record.connections.length > 0;
      }
      return false;
    };

    const checkIntegrationStatus = async () => {
      if (!organizationId) {
        setWhatsappConnected(false);
        setInstagramConnected(false);
        setPaymentConnected(false);
        setOrganizationDetails(null);
        setIntegrationLoading(false);
        return;
      }

      setIntegrationLoading(true);
      let nextWhatsappConnected = false;
      let nextInstagramConnected = false;
      let nextPaymentConnected = false;

      try {
        const [whatsappResult, instagramResult, orgResult] = await Promise.allSettled([
          client.get('/provider/whatsapp/status'),
          client.get('/provider/instagram/status'),
          organizationId ? client.get(endpoints.org(organizationId)) : Promise.resolve(null),
        ]);

        if (whatsappResult.status === 'fulfilled') {
          const payload = whatsappResult.value?.data?.data ?? whatsappResult.value?.data;
          nextWhatsappConnected = parseIntegrationFlag(payload);
        } else {
          console.error('Failed to check WhatsApp status:', whatsappResult.reason);
        }

        if (instagramResult.status === 'fulfilled') {
          const payload = instagramResult.value?.data?.data ?? instagramResult.value?.data;
          nextInstagramConnected = parseIntegrationFlag(payload);
        } else {
          console.error('Failed to check Instagram status:', instagramResult.reason);
        }

        if (orgResult.status === 'fulfilled' && orgResult.value) {
          const orgResponse = orgResult.value;
          const orgPayload = orgResponse.data?.data?.org ?? orgResponse.data?.org ?? orgResponse.data;
          setOrganizationDetails(orgPayload || null);
          const integrations = orgPayload?.settings?.integrations;
          if (integrations && typeof integrations === 'object') {
            const whatsappSettings = (integrations as Record<string, unknown>).whatsapp;
            const instagramSettings = (integrations as Record<string, unknown>).instagram;
            if (whatsappSettings) {
              nextWhatsappConnected = parseIntegrationFlag(whatsappSettings) || nextWhatsappConnected;
            }
            if (instagramSettings) {
              nextInstagramConnected = parseIntegrationFlag(instagramSettings) || nextInstagramConnected;
            }
            const paystackSettings = (integrations as Record<string, unknown>).paystack;
            if (paystackSettings) {
              nextPaymentConnected = parseIntegrationFlag(paystackSettings);
            }
          }
        } else if (orgResult.status === 'rejected') {
          console.error('Failed to load organization settings:', orgResult.reason);
          setOrganizationDetails(null);
        }
      } catch (error) {
        console.error('Error checking integration status:', error);
      } finally {
        setWhatsappConnected(nextWhatsappConnected);
        setInstagramConnected(nextInstagramConnected);
        setPaymentConnected(nextPaymentConnected);
        setIntegrationLoading(false);
      }
    };

    checkIntegrationStatus();
  }, [organizationId]);

  // Fetch actual leads and threads counts
  useEffect(() => {
    const fetchActualCounts = async () => {
      try {
        setCountsLoading(true);

        // Fetch leads count
        try {
          const leadsResp = await client.get('/leads');
          const leadsList: BackendLead[] = leadsResp?.data?.data?.leads || leadsResp?.data || [];
          // Filter for user assigned leads
          const userLeads = leadsList.filter((lead) => lead.assignedTo === user?.id);
          setActualLeadsCount(userLeads.length);
        } catch (error) {
          console.error('Failed to fetch leads count:', error);
          setActualLeadsCount(0);
        }

        // Fetch threads count
        try {
          const threadsResp = await client.get('/threads');
          // threadsList type depends on what the API returns, assuming it has assignedTo
          const threadsList: Array<{ assignedTo?: string }> = threadsResp?.data?.data?.threads || threadsResp?.data || [];
          // Filter for user assigned threads
          const userThreads = threadsList.filter((thread) => thread.assignedTo === user?.id);
          setActualThreadsCount(userThreads.length);
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

    if (user?.id) {
      fetchActualCounts();
    }
  }, [user?.id]);

  // Fetch analytics and dashboard data when range changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, timeRange]);

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
      {/* Beta Banner */}
      {showBetaBanner && (
        <div className='bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div className='flex items-start sm:items-center gap-3'>
            <div className='bg-primary/20 p-2 rounded-full shrink-0'>
              <Sparkles className='h-5 w-5 text-primary' />
            </div>
            <div>
              <p className='font-medium text-foreground'>Welcome to LeadsBox Closed Beta!</p>
              <p className='text-sm text-muted-foreground'>
                You're among our first users. As we refine the app, some features may change. Please share your feedback to help us improve!
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2 w-full sm:w-auto shrink-0'>
            <Button size='sm' variant='outline' onClick={() => setIsFeedbackModalOpen(true)} className='w-full sm:w-auto bg-background'>
              Give Feedback
            </Button>
            <Button size='sm' variant='ghost' onClick={dismissBetaBanner} className='w-full sm:w-auto text-muted-foreground hover:bg-primary/10'>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
        <div className='space-y-3'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Home</h1>
            <p className='text-sm sm:text-base text-muted-foreground'>Welcome back! Here's what's happening with your business.</p>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <IntegrationBadge
              icon={WhatsAppIcon}
              label='WhatsApp'
              connected={whatsappConnected}
              loading={integrationLoading}
              to='/dashboard/settings?tab=integrations'
            />
            <IntegrationBadge
              icon={Instagram}
              label='Instagram'
              connected={instagramConnected}
              loading={integrationLoading}
              to='/dashboard/settings?tab=integrations'
              color='purple'
            />
            <div className='flex items-center gap-2 px-2 py-1 rounded-full text-xs border'>
              <div
                className={`w-2 h-2 rounded-full ${
                  analyticsError ? 'bg-red-500' : analyticsLoading ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                }`}
              ></div>
              <span className={analyticsError ? 'text-red-600' : analyticsLoading ? 'text-blue-600' : 'text-emerald-700'}>
                {analyticsError ? ' Not Connected' : analyticsLoading ? 'Refreshing…' : 'Connected'}
              </span>
            </div>
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

      {showOnboardingChecklist ? (
        <OnboardingChecklist steps={onboardingSteps} className='transition-all duration-200 hover:shadow-md border-primary/20' />
      ) : null}

      {/* Overview Cards */}
      {countsLoading && analyticsLoading ? (
        overviewSkeleton
      ) : (
        <div className='grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='transition-all duration-200 hover:shadow-md'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>New Leads This Week</CardTitle>
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
              <CardTitle className='text-sm font-medium'>Conversations This Week</CardTitle>
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
              {analyticsLoading ? (
                <Skeleton className='h-7 w-20' />
              ) : (
                <>
                  <div className='text-2xl font-bold'>{formatPercentage(analyticsOverview.conversionRate)}</div>
                  <Progress value={analyticsOverview.conversionRate} className='mt-2' />
                </>
              )}
            </CardContent>
          </Card>

          <Card className='transition-all duration-200 hover:shadow-md'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Follow-ups Due Today</CardTitle>
              <CheckSquare className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <Skeleton className='h-7 w-16' />
              ) : (
                <div className='text-2xl font-bold'>{taskBuckets.today.length + taskBuckets.overdue.length}</div>
              )}
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                {taskBuckets.overdue.length > 0 ? (
                  <>
                    <TrendingUp className='h-3 w-3 text-red-500' />
                    <span className='text-red-500'>{taskBuckets.overdue.length} overdue</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className='h-3 w-3 text-green-500' />
                    <span className='text-green-500'>You're all caught up</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {analyticsError && <p className='text-sm text-destructive'>{analyticsError}</p>}

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
        <Card className='transition-all duration-200 hover:shadow-md flex flex-col h-[440px]'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 shrink-0'>
            <CardTitle className='text-lg'>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 overflow-y-auto space-y-4 pb-2'>
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
          <div className='shrink-0 px-6 py-3 border-t'>
            <Button asChild variant='ghost' size='sm' className='w-full text-muted-foreground hover:text-foreground'>
              <Link to='/dashboard/leads'>View More Leads →</Link>
            </Button>
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className='transition-all duration-200 hover:shadow-md flex flex-col h-[440px]'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 shrink-0'>
            <CardTitle className='text-lg'>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 overflow-y-auto space-y-4 pb-2'>
            {tasksLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`dashboard-task-skeleton-${index}`} className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-5 w-16 rounded-full' />
                  </div>
                ))}
              </div>
            ) : tasksError ? (
              <p className='text-sm text-destructive text-center py-4'>{tasksError}</p>
            ) : todayTasks.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>No tasks scheduled for today</p>
            ) : (
              todayTasks.map((task) => (
                <div key={task.id} className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='font-medium'>{task.title}</div>
                    <div className='text-sm text-muted-foreground capitalize'>{task.type.toLowerCase()}</div>
                  </div>
                  <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
          <div className='shrink-0 px-6 py-3 border-t'>
            <Button asChild variant='ghost' size='sm' className='w-full text-muted-foreground hover:text-foreground'>
              <Link to='/dashboard/tasks'>View More Tasks →</Link>
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className='transition-all duration-200 hover:shadow-md flex flex-col h-[440px]'>
          <CardHeader className='shrink-0'>
            <CardTitle className='text-lg'>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 overflow-y-auto space-y-4 pb-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <CheckSquare className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>Tasks Due Today</span>
              </div>
              <Badge variant='outline'>{renderTaskMetric(todayTasks.length)}</Badge>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-destructive' />
                <span className='text-sm'>Overdue Tasks</span>
              </div>
              <Badge variant='destructive'>{renderTaskMetric(overdueTasks.length)}</Badge>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>Upcoming Tasks</span>
              </div>
              <Badge variant='outline'>{renderTaskMetric(upcomingTasks.length)}</Badge>
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

            <div className='rounded-lg border bg-muted/20 p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Core Flow Reliability</span>
                <Badge variant='outline'>Auto-monitored</Badge>
              </div>
              {reliabilityRows.map((row) => {
                const status = getReliabilityStatus(row.data.errorRate, row.data.p95Ms);
                const statusVariant = status === 'critical' ? 'destructive' : status === 'watch' ? 'secondary' : 'outline';
                return (
                  <div key={row.key} className='flex items-center justify-between gap-2 text-xs'>
                    <span className='text-muted-foreground'>{row.label}</span>
                    <div className='flex items-center gap-2'>
                      <span>p95 {row.data.p95Ms || 0}ms</span>
                      <span>{Math.round((row.data.errorRate || 0) * 100)}% err</span>
                      <Badge variant={statusVariant}>{status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className='rounded-lg border bg-muted/20 p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Activation Funnel (30d)</span>
                <Badge variant='outline'>Launch KPI</Badge>
              </div>
              {activationFunnelLoading ? (
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                </div>
              ) : activationFunnel?.steps?.length ? (
                <>
                  {activationFunnel.steps.map((step, index) => (
                    <div key={step.id} className='flex items-center justify-between gap-2 text-xs'>
                      <span className='text-muted-foreground'>
                        {index + 1}. {step.label}
                      </span>
                      <div className='flex items-center gap-2'>
                        <span>{step.count}</span>
                        {index > 0 ? <span>{step.conversionFromPreviousPct.toFixed(1)}%</span> : null}
                      </div>
                    </div>
                  ))}
                  {activationFunnel.dropOff.length > 0 ? (
                    <div className='pt-1 text-xs text-muted-foreground'>
                      Biggest drop-off:{' '}
                      {activationFunnel.dropOff
                        .slice()
                        .sort((a, b) => b.dropOffPct - a.dropOffPct)[0]
                        ?.dropOffPct.toFixed(1)}
                      %
                    </div>
                  ) : null}
                </>
              ) : (
                <p className='text-xs text-muted-foreground'>No activation funnel data yet.</p>
              )}
            </div>

            <div className='pt-2'>
              <Button className='w-full mt-2' variant='secondary' onClick={() => downloadPmfReport(7)} disabled={pmfReportLoading}>
                {pmfReportLoading ? 'Preparing report...' : 'Download PMF Weekly Report'}
              </Button>
            </div>
          </CardContent>
          <div className='shrink-0 px-6 py-3 border-t'>
            <Button asChild variant='ghost' size='sm' className='w-full text-muted-foreground hover:text-foreground'>
              <Link to='/dashboard/analytics'>
                <TrendingUp className='h-4 w-4 mr-2' />
                View Detailed Analytics →
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
    </div>
  );
}
