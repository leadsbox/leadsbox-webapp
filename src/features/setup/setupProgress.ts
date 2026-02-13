import client from '@/api/client';
import { endpoints } from '@/api/config';
import { salesApi } from '@/api/sales';
import { trackAppEvent } from '@/lib/productTelemetry';

export type SetupMetrics = {
  leadsCount: number;
  paidSalesCount: number;
  pendingAiReviews: number;
  followUpsCount: number;
  channelConnected: boolean;
  connectedChannels: string[];
  leadSourceBreakdown: Record<string, number>;
};

export const defaultSetupMetrics: SetupMetrics = {
  leadsCount: 0,
  paidSalesCount: 0,
  pendingAiReviews: 0,
  followUpsCount: 0,
  channelConnected: false,
  connectedChannels: [],
  leadSourceBreakdown: {},
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const MILESTONE_KEYS = {
  firstLead: 'lb_funnel_first_lead_tracked',
  firstPaidSale: 'lb_funnel_first_paid_sale_tracked',
  activation: 'lb_funnel_activation_tracked',
  weeklySnapshotAt: 'lb_funnel_weekly_snapshot_at',
} as const;

const getStatusPayload = async (paths: string[]): Promise<Record<string, unknown> | null> => {
  for (const path of paths) {
    try {
      const response = await client.get(path);
      const payload = (response?.data?.data || response?.data) as Record<string, unknown> | undefined;
      if (payload) {
        return payload;
      }
    } catch {
      // Try fallback endpoint.
    }
  }
  return null;
};

const getBoolean = (value: unknown): boolean => value === true;

export const fetchSetupMetrics = async (): Promise<SetupMetrics> => {
  const [leadsRes, paidSalesRes, reviewInboxRes, followUpsRes, whatsappStatus, instagramStatus] = await Promise.all([
    client.get(endpoints.leads),
    salesApi.list({ status: 'PAID' }),
    salesApi.reviewInbox(1),
    client.get(endpoints.followups),
    getStatusPayload(['/provider/whatsapp/status', endpoints.whatsapp.status]),
    getStatusPayload(['/provider/instagram/status']),
  ]);

  const leads = leadsRes?.data?.data?.leads || leadsRes?.data || [];
  const paidSales = paidSalesRes?.data?.sales || [];
  const pendingAiReviews = reviewInboxRes?.data?.summary?.pendingCount || 0;
  const followUps = followUpsRes?.data?.data?.followUps || followUpsRes?.data?.followUps || [];
  const leadList = Array.isArray(leads) ? leads : [];

  const leadSourceBreakdown = leadList.reduce<Record<string, number>>((acc, lead) => {
    const source = String((lead as { provider?: string; source?: string }).provider || (lead as { source?: string }).source || 'manual').toLowerCase();
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const channelStates: Array<{ name: string; connected: boolean }> = [
    { name: 'whatsapp', connected: getBoolean(whatsappStatus?.connected) },
    { name: 'instagram', connected: getBoolean(instagramStatus?.connected) },
  ];

  const connectedChannels = channelStates.filter((channel) => channel.connected).map((channel) => channel.name);

  return {
    leadsCount: leadList.length,
    paidSalesCount: Array.isArray(paidSales) ? paidSales.length : 0,
    pendingAiReviews,
    followUpsCount: Array.isArray(followUps) ? followUps.length : 0,
    channelConnected: connectedChannels.length > 0,
    connectedChannels,
    leadSourceBreakdown,
  };
};

export const hasReachedFirstValue = (metrics: SetupMetrics): boolean => {
  return metrics.channelConnected && metrics.leadsCount > 0 && metrics.paidSalesCount > 0;
};

export const trackFunnelMilestones = (metrics: SetupMetrics): void => {
  if (typeof window === 'undefined') return;

  if (metrics.leadsCount > 0 && !window.localStorage.getItem(MILESTONE_KEYS.firstLead)) {
    trackAppEvent('funnel_first_lead_reached', {
      leadsCount: metrics.leadsCount,
      leadSourceBreakdown: metrics.leadSourceBreakdown,
    });
    window.localStorage.setItem(MILESTONE_KEYS.firstLead, '1');
  }

  if (metrics.paidSalesCount > 0 && !window.localStorage.getItem(MILESTONE_KEYS.firstPaidSale)) {
    trackAppEvent('funnel_first_paid_sale_reached', {
      paidSalesCount: metrics.paidSalesCount,
      connectedChannels: metrics.connectedChannels,
    });
    window.localStorage.setItem(MILESTONE_KEYS.firstPaidSale, '1');
  }

  if (hasReachedFirstValue(metrics) && !window.localStorage.getItem(MILESTONE_KEYS.activation)) {
    trackAppEvent('funnel_activation_reached', {
      connectedChannels: metrics.connectedChannels,
      leadsCount: metrics.leadsCount,
      paidSalesCount: metrics.paidSalesCount,
    });
    window.localStorage.setItem(MILESTONE_KEYS.activation, '1');
  }
};

export const trackWeeklyFunnelSnapshot = (metrics: SetupMetrics): void => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const lastSnapshotAt = Number(window.localStorage.getItem(MILESTONE_KEYS.weeklySnapshotAt) || 0);

  if (Number.isFinite(lastSnapshotAt) && now - lastSnapshotAt < WEEK_MS) {
    return;
  }

  trackAppEvent('funnel_weekly_snapshot', {
    capturedAt: new Date(now).toISOString(),
    connectedChannels: metrics.connectedChannels,
    channelConnected: metrics.channelConnected,
    leadsCount: metrics.leadsCount,
    paidSalesCount: metrics.paidSalesCount,
    pendingAiReviews: metrics.pendingAiReviews,
    followUpsCount: metrics.followUpsCount,
    leadSourceBreakdown: metrics.leadSourceBreakdown,
    firstValueComplete: hasReachedFirstValue(metrics),
  });

  window.localStorage.setItem(MILESTONE_KEYS.weeklySnapshotAt, String(now));
};
