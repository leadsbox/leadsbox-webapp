import client from '@/api/client';
import { endpoints } from '@/api/config';
import { salesApi } from '@/api/sales';

export type SetupMetrics = {
  leadsCount: number;
  paidSalesCount: number;
  pendingAiReviews: number;
  followUpsCount: number;
};

export const defaultSetupMetrics: SetupMetrics = {
  leadsCount: 0,
  paidSalesCount: 0,
  pendingAiReviews: 0,
  followUpsCount: 0,
};

export const fetchSetupMetrics = async (): Promise<SetupMetrics> => {
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

  return {
    leadsCount: Array.isArray(leads) ? leads.length : 0,
    paidSalesCount: Array.isArray(paidSales) ? paidSales.length : 0,
    pendingAiReviews,
    followUpsCount: Array.isArray(followUps) ? followUps.length : 0,
  };
};

export const hasReachedFirstValue = (metrics: SetupMetrics): boolean => {
  if (metrics.leadsCount <= 0) return false;
  return metrics.paidSalesCount > 0 || metrics.followUpsCount > 0 || metrics.pendingAiReviews > 0;
};
