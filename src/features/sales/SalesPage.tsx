import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, DollarSign, Filter, MessageSquare, Search, ShieldCheck, ShoppingBag, Sparkles, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Lead, LeadLabel, leadLabelUtils } from '@/types';
import { notify } from '@/lib/toast';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { useNavigate } from 'react-router-dom';
import { salesApi, Sale, UpdateSaleInput } from '@/api/sales';
import SalesDetailModal from './SalesDetailModal';
import { trackAppEvent, trackMobileBlocked } from '@/lib/productTelemetry';

interface BackendLead {
  id: string;
  organizationId: string;
  conversationId?: string;
  providerId?: string;
  provider?: string;
  label?: string;
  userId?: string;
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    profileImage?: string | null;
  };
  notes?: Array<{
    id: string;
    note: string;
    createdAt: string;
    author?: {
      id: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      profileImage?: string | null;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

interface PipelineAssignedUser {
  id: string;
  name: string;
  avatar?: string | null;
}

type SalesBucketKey = 'SALES' | 'INQUIRIES' | 'PENDING' | 'CLOSED';

const PIPELINE_LABELS: LeadLabel[] = [
  'NEW_LEAD',
  'ENGAGED',
  'FOLLOW_UP_REQUIRED',
  'TRANSACTION_IN_PROGRESS',
  'PAYMENT_PENDING',
  'TRANSACTION_SUCCESSFUL',
  'CLOSED_LOST_TRANSACTION',
  'PRICING_INQUIRY',
];

const LEGACY_STAGE_MAP: Record<string, LeadLabel> = {
  NEW: 'NEW_LEAD',
  QUALIFIED: 'ENGAGED',
  IN_PROGRESS: 'TRANSACTION_IN_PROGRESS',
  WON: 'TRANSACTION_SUCCESSFUL',
  LOST: 'CLOSED_LOST_TRANSACTION',
};

const SALES_BUCKETS: Record<
  SalesBucketKey,
  {
    title: string;
    description: string;
    accent: string;
    matches: (lead: Lead) => boolean;
  }
> = {
  SALES: {
    title: 'Sales made',
    description: 'Closed conversations where you recorded a win.',
    accent: 'text-emerald-500',
    matches: (lead) => lead.stage === 'TRANSACTION_SUCCESSFUL',
  },
  INQUIRIES: {
    title: 'Inquiries',
    description: 'People still chatting, asking for pricing, or reviewing offers.',
    accent: 'text-sky-500',
    matches: (lead) => ['NEW_LEAD', 'ENGAGED', 'FOLLOW_UP_REQUIRED', 'PRICING_INQUIRY'].includes(lead.stage),
  },
  PENDING: {
    title: 'Payment pending',
    description: 'Deals in progress that need an invoice or confirmation.',
    accent: 'text-amber-500',
    matches: (lead) => ['TRANSACTION_IN_PROGRESS', 'PAYMENT_PENDING'].includes(lead.stage),
  },
  CLOSED: {
    title: 'Closed or lost',
    description: 'Conversations marked as lost or archived.',
    accent: 'text-rose-500',
    matches: (lead) => lead.stage === 'CLOSED_LOST_TRANSACTION',
  },
};

const normalizeLabelToStage = (label?: string): LeadLabel => {
  if (!label) return 'NEW_LEAD';
  const normalized = label.toUpperCase();
  if (PIPELINE_LABELS.includes(normalized as LeadLabel)) {
    return normalized as LeadLabel;
  }
  if (normalized in LEGACY_STAGE_MAP) {
    return LEGACY_STAGE_MAP[normalized];
  }
  return 'NEW_LEAD';
};

const channelOptions: Array<{ value: 'ALL' | Lead['source']; label: string }> = [
  { value: 'ALL', label: 'All channels' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
  { value: 'manual', label: 'Manual' },
];

const statusOptions: Array<{ value: SalesBucketKey; label: string }> = [
  { value: 'SALES', label: 'Sales made' },
  { value: 'INQUIRIES', label: 'Inquiries' },
  { value: 'PENDING', label: 'Payment pending' },
  { value: 'CLOSED', label: 'Closed or lost' },
];

const getConfidenceRisk = (confidence?: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const score = Number(confidence || 0);
  if (score >= 0.85) return 'LOW';
  if (score >= 0.65) return 'MEDIUM';
  return 'HIGH';
};

const getRiskBadgeClass = (risk: 'HIGH' | 'MEDIUM' | 'LOW'): string => {
  if (risk === 'HIGH') return 'border-red-200 bg-red-50 text-red-700';
  if (risk === 'MEDIUM') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const SalesPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesBucketKey>('SALES');
  const [channelFilter, setChannelFilter] = useState<'ALL' | Lead['source']>('ALL');
  const { getMemberByUserId } = useOrgMembers();
  const navigate = useNavigate();

  // Sales-specific state
  const [sales, setSales] = useState<Sale[]>([]);
  const [reviewInboxSales, setReviewInboxSales] = useState<Sale[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{
    pendingCount: number;
    highRiskCount: number;
    averageConfidence: number;
  }>({
    pendingCount: 0,
    highRiskCount: 0,
    averageConfidence: 0,
  });
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickCaptureLeadId, setQuickCaptureLeadId] = useState('');
  const [quickCaptureAmount, setQuickCaptureAmount] = useState('');
  const [quickCaptureCurrency, setQuickCaptureCurrency] = useState('NGN');
  const [quickCaptureNote, setQuickCaptureNote] = useState('');
  const [isQuickCapturing, setIsQuickCapturing] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await client.get(endpoints.leads);
      const list: BackendLead[] = response?.data?.data?.leads || response?.data || [];

      const mapped: Lead[] = list.map((l) => {
        const normalizedLabel = normalizeLabelToStage(l.label);
        return {
          id: l.id,
          name: l.providerId ? `Lead ${String(l.providerId).slice(0, 6)}` : l.conversationId || 'Lead',
          email: l.user?.email || '',
          phone: undefined,
          company: undefined,
          source: (String(l.provider || 'manual').toLowerCase() as Lead['source']) || 'manual',
          stage: normalizedLabel,
          priority: 'MEDIUM',
          tags: normalizedLabel ? [normalizedLabel] : [],
          assignedTo: l.user?.id || l.userId || '',
          value: undefined,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
          lastActivity: l.lastMessageAt,
          conversationId: l.conversationId,
          providerId: l.providerId,
          from: l.providerId || l.conversationId,
          label: normalizedLabel,
          notes: l.notes?.[0]?.note || '',
          noteHistory:
            l.notes?.map((note) => ({
              id: note.id,
              note: note.note,
              createdAt: note.createdAt,
              author: note.author
                ? {
                    id: note.author.id,
                    email: note.author.email ?? null,
                    firstName: note.author.firstName ?? null,
                    lastName: note.author.lastName ?? null,
                    username: note.author.username ?? null,
                    profileImage: note.author.profileImage ?? null,
                  }
                : undefined,
            })) || [],
        };
      });

      setLeads(mapped);
    } catch (error) {
      console.error('Failed to load sales data', error);
      setLeads([]);
      notify.error({
        key: 'sales:load:error',
        title: 'Unable to load sales',
        description: 'Try refreshing the page to pull conversations again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      setIsSalesLoading(true);
      const response = await salesApi.list();
      setSales(response?.data?.sales || []);
    } catch (error) {
      console.error('Failed to load sales:', error);
      notify.error({
        key: 'sales:load:error',
        title: 'Unable to load sales',
        description: 'Failed to fetch auto-detected sales.',
      });
    } finally {
      setIsSalesLoading(false);
    }
  }, []);

  const fetchReviewInbox = useCallback(async () => {
    try {
      const response = await salesApi.reviewInbox(50);
      setReviewInboxSales(response?.data?.sales || []);
      setReviewSummary(
        response?.data?.summary || {
          pendingCount: 0,
          highRiskCount: 0,
          averageConfidence: 0,
        }
      );
    } catch (error) {
      console.error('Failed to load sales review inbox:', error);
      setReviewInboxSales([]);
      setReviewSummary({
        pendingCount: 0,
        highRiskCount: 0,
        averageConfidence: 0,
      });
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchSales();
    fetchReviewInbox();
  }, [fetchLeads, fetchSales, fetchReviewInbox]);

  const handleUpdateStatus = useCallback(
    async (leadId: string, newLabel: LeadLabel) => {
      try {
        // Optimistic update
        setLeads((prevLeads) => prevLeads.map((lead) => (lead.id === leadId ? { ...lead, stage: newLabel, label: newLabel } : lead)));

        await client.put(`${endpoints.leads}/${leadId}`, { label: newLabel });

        notify.success({
          key: `lead-update-${leadId}`,
          title: 'Status updated',
          description: `Lead moved to ${leadLabelUtils.getDisplayName(newLabel)}`,
        });

        // Refresh to get latest data
        await fetchLeads();
      } catch (error) {
        console.error('Failed to update lead status:', error);
        if (window.matchMedia('(max-width: 768px)').matches) {
          trackMobileBlocked('lead_stage_update', 'update_failed', {
            leadId,
            newLabel,
          });
        }
        notify.error({
          key: `lead-update-error-${leadId}`,
          title: 'Update failed',
          description: 'Unable to change status. Please try again.',
        });
        // Revert optimistic update
        await fetchLeads();
      }
    },
    [fetchLeads],
  );

  const handleApproveSale = useCallback(
    async (saleId: string) => {
      try {
        await salesApi.approve(saleId);
        trackAppEvent('sales_review_approved', { saleId });
        notify.success({
          key: `sale-approve-${saleId}`,
          title: 'Sale approved',
          description: 'The auto-detected sale has been approved.',
        });
        await fetchSales();
        await fetchReviewInbox();
        setSelectedSale(null);
      } catch (error) {
        console.error('Failed to approve sale:', error);
        if (window.matchMedia('(max-width: 768px)').matches) {
          trackMobileBlocked('sales_review', 'approve_failed', { saleId });
        }
        notify.error({
          key: `sale-approve-error-${saleId}`,
          title: 'Approval failed',
          description: 'Unable to approve sale. Please try again.',
        });
      }
    },
    [fetchReviewInbox, fetchSales],
  );

  const handleUpdateSale = useCallback(
    async (saleId: string, data: UpdateSaleInput) => {
      try {
        await salesApi.update(saleId, data);
        notify.success({
          key: `sale-update-${saleId}`,
          title: 'Sale updated',
          description: 'The sale details have been updated.',
        });
        await fetchSales();
        await fetchReviewInbox();
        setSelectedSale(null);
      } catch (error) {
        console.error('Failed to update sale:', error);
        notify.error({
          key: `sale-update-error-${saleId}`,
          title: 'Update failed',
          description: 'Unable to update sale. Please try again.',
        });
      }
    },
    [fetchReviewInbox, fetchSales],
  );

  const handleMarkSalePaid = useCallback(
    async (saleId: string) => {
      try {
        await salesApi.update(saleId, { status: 'PAID' });
        notify.success({
          key: `sale-mark-paid-${saleId}`,
          title: 'Sale marked as paid',
          description: 'Payment status has been updated.',
        });
        await fetchSales();
        await fetchReviewInbox();
        setSelectedSale(null);
      } catch (error) {
        console.error('Failed to mark sale as paid:', error);
        notify.error({
          key: `sale-mark-paid-error-${saleId}`,
          title: 'Update failed',
          description: 'Unable to mark this sale as paid.',
        });
      }
    },
    [fetchReviewInbox, fetchSales],
  );

  const handleDeleteSale = useCallback(
    async (saleId: string) => {
      try {
        await salesApi.delete(saleId);
        notify.success({
          key: `sale-delete-${saleId}`,
          title: 'Sale deleted',
          description: 'The sale has been removed.',
        });
        await fetchSales();
        await fetchReviewInbox();
        setSelectedSale(null);
      } catch (error) {
        console.error('Failed to delete sale:', error);
        notify.error({
          key: `sale-delete-error-${saleId}`,
          title: 'Deletion failed',
          description: 'Unable to delete sale. Please try again.',
        });
      }
    },
    [fetchReviewInbox, fetchSales],
  );

  const handleRejectSale = useCallback(
    async (saleId: string) => {
      try {
        await salesApi.reject(saleId);
        trackAppEvent('sales_review_rejected', { saleId });
        notify.success({
          key: `sale-reject-${saleId}`,
          title: 'Sale rejected',
          description: 'The AI-detected sale has been removed from review queue.',
        });
        await fetchSales();
        await fetchReviewInbox();
        if (selectedSale?.id === saleId) {
          setSelectedSale(null);
        }
      } catch (error) {
        console.error('Failed to reject sale:', error);
        notify.error({
          key: `sale-reject-error-${saleId}`,
          title: 'Rejection failed',
          description: 'Unable to reject sale. Please try again.',
        });
      }
    },
    [fetchReviewInbox, fetchSales, selectedSale?.id],
  );

  const handleQuickCaptureSale = useCallback(async () => {
    const normalizedLeadId = quickCaptureLeadId.trim();
    const normalizedAmount = Number(quickCaptureAmount);

    if (!normalizedLeadId || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      notify.error({
        key: 'sale-quick-capture-invalid',
        title: 'Missing details',
        description: 'Lead ID and a valid amount are required.',
      });
      if (window.matchMedia('(max-width: 768px)').matches) {
        trackMobileBlocked('quick_capture', 'missing_fields');
      }
      return;
    }

    try {
      setIsQuickCapturing(true);
      await salesApi.quickCapture({
        leadId: normalizedLeadId,
        amount: normalizedAmount,
        currency: quickCaptureCurrency.trim() || 'NGN',
        note: quickCaptureNote.trim() || undefined,
        status: 'PAID',
      });

      trackAppEvent('sales_quick_capture_created', {
        leadId: normalizedLeadId,
        amount: normalizedAmount,
        currency: quickCaptureCurrency.trim() || 'NGN',
      });

      notify.success({
        key: 'sale-quick-capture-created',
        title: 'Sale recorded',
        description: 'Quick payment capture saved successfully.',
      });

      setIsQuickCaptureOpen(false);
      setQuickCaptureLeadId('');
      setQuickCaptureAmount('');
      setQuickCaptureNote('');
      await fetchSales();
      await fetchReviewInbox();
    } catch (error) {
      console.error('Failed to quick-capture sale:', error);
      notify.error({
        key: 'sale-quick-capture-error',
        title: 'Capture failed',
        description: 'Unable to record quick sale right now.',
      });
    } finally {
      setIsQuickCapturing(false);
    }
  }, [
    fetchReviewInbox,
    fetchSales,
    quickCaptureAmount,
    quickCaptureCurrency,
    quickCaptureLeadId,
    quickCaptureNote,
  ]);

  const resolveAssignedUser = useCallback(
    (userId?: string | null): PipelineAssignedUser | undefined => {
      if (!userId) return undefined;
      const member = getMemberByUserId(userId);
      if (!member) return undefined;
      const { user } = member;
      const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
      const name = fullName || user?.username || user?.email || 'Team member';
      return {
        id: member.userId,
        name,
        avatar: user?.profileImage ?? null,
      };
    },
    [getMemberByUserId],
  );

  const groupedLeads = useMemo(() => {
    const initial: Record<SalesBucketKey, Lead[]> = {
      SALES: [],
      INQUIRIES: [],
      PENDING: [],
      CLOSED: [],
    };
    leads.forEach((lead) => {
      (Object.keys(SALES_BUCKETS) as SalesBucketKey[]).forEach((bucketKey) => {
        if (SALES_BUCKETS[bucketKey].matches(lead)) {
          initial[bucketKey].push(lead);
        }
      });
    });
    return initial;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const dataset = groupedLeads[statusFilter];
    const search = searchQuery.trim().toLowerCase();
    return dataset
      .filter((lead) => (channelFilter === 'ALL' ? true : lead.source === channelFilter))
      .filter((lead) => {
        if (!search) return true;
        return (
          lead.name.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search) ||
          lead.label?.toLowerCase().includes(search) ||
          lead.notes?.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [groupedLeads, statusFilter, channelFilter, searchQuery]);

  const stats = useMemo(() => {
    const inquiries = groupedLeads.INQUIRIES.length;
    const pending = groupedLeads.PENDING.length;
    const closed = groupedLeads.CLOSED.length;
    const pendingReview = reviewSummary.pendingCount;
    return [
      {
        label: 'Total sales',
        value: sales.length,
        change: sales.filter((s) => new Date(s.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7).length,
        helper: `${sales.filter((s) => s.status === 'PAID').length} paid`,
        icon: ShoppingBag,
      },
      {
        label: 'Pending review',
        value: pendingReview,
        helper: 'AI-detected sales',
        icon: Sparkles,
        highlight: pendingReview > 0,
      },
      {
        label: 'Active inquiries',
        value: inquiries,
        helper: 'Monitor new chats',
        icon: MessageSquare,
      },
      {
        label: 'Payments pending',
        value: pending,
        helper: 'Needs invoice',
        icon: DollarSign,
      },
      {
        label: 'Closed or lost',
        value: closed,
        helper: 'Keep learnings',
        icon: User,
      },
    ];
  }, [groupedLeads, reviewSummary.pendingCount, sales]);

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell colSpan={6}>
            <Skeleton className='h-12 w-full' />
          </TableCell>
        </TableRow>
      ));
    }

    if (!filteredLeads.length) {
      return (
        <TableRow>
          <TableCell colSpan={6} className='text-center py-6 text-muted-foreground'>
            No records found in this view.
          </TableCell>
        </TableRow>
      );
    }

    return filteredLeads.map((lead) => {
      const assigned = resolveAssignedUser(lead.assignedTo);
      return (
        <TableRow
          key={lead.id}
          className='cursor-pointer transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2'
          tabIndex={0}
          onClick={() => navigate(`/dashboard/sales/${lead.id}`)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigate(`/dashboard/sales/${lead.id}`);
            }
          }}
        >
          <TableCell className='whitespace-nowrap'>
            <div>
              <p className='font-medium'>{lead.name}</p>
              <p className='text-xs text-muted-foreground'>{lead.email || '—'}</p>
            </div>
          </TableCell>
          <TableCell className='hidden md:table-cell' onClick={(e) => e.stopPropagation()}>
            <Select value={lead.stage} onValueChange={(value) => handleUpdateStatus(lead.id, value as LeadLabel)}>
              <SelectTrigger className='w-[200px] h-8'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='NEW_LEAD'>New Lead</SelectItem>
                <SelectItem value='ENGAGED'>Engaged</SelectItem>
                <SelectItem value='FOLLOW_UP_REQUIRED'>Follow Up Required</SelectItem>
                <SelectItem value='PRICING_INQUIRY'>Pricing Inquiry</SelectItem>
                <SelectItem value='TRANSACTION_IN_PROGRESS'>Transaction In Progress</SelectItem>
                <SelectItem value='PAYMENT_PENDING'>Payment Pending</SelectItem>
                <SelectItem value='TRANSACTION_SUCCESSFUL'>✅ Sale Successful</SelectItem>
                <SelectItem value='CLOSED_LOST_TRANSACTION'>❌ Lost</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell className='hidden lg:table-cell text-sm text-muted-foreground'>
            {lead.source === 'manual' ? 'Manual entry' : lead.source.charAt(0).toUpperCase() + lead.source.slice(1)}
          </TableCell>
          <TableCell className='hidden md:table-cell text-sm'>{lead.value ? `$${lead.value.toLocaleString()}` : '—'}</TableCell>
          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
            {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
          </TableCell>
          <TableCell className='w-[180px]'>
            {assigned ? (
              <div className='flex items-center gap-2'>
                <Avatar className='h-7 w-7'>
                  {assigned.avatar ? (
                    <AvatarImage src={assigned.avatar} alt={assigned.name} />
                  ) : (
                    <AvatarFallback>
                      {assigned.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className='text-sm'>{assigned.name}</span>
              </div>
            ) : (
              <span className='text-sm text-muted-foreground'>Unassigned</span>
            )}
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className='p-4 sm:p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Sales from Conversations</h1>
          <p className='text-sm text-muted-foreground'>
            Sort WhatsApp and Telegram chats into sales made, inquiries, and deals that still need your attention.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='secondary' onClick={() => setIsQuickCaptureOpen(true)}>
            <Zap className='h-4 w-4 mr-2' />
            Quick capture
          </Button>
          <Button
            variant='outline'
            onClick={async () => {
              await Promise.all([fetchLeads(), fetchSales(), fetchReviewInbox()]);
            }}
            disabled={isLoading && leads.length === 0}
          >
            <Filter className='h-4 w-4 mr-2' />
            Refresh data
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{stat.label}</CardTitle>
                <Icon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                {stat.change !== undefined ? (
                  <p className='text-xs text-muted-foreground'>{stat.change} updated this week</p>
                ) : (
                  <p className='text-xs text-muted-foreground'>{stat.helper}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Review Inbox */}
      {(reviewInboxSales.length > 0 || isSalesLoading) && (
        <Card className='border-primary/20 bg-primary/5'>
          <CardHeader>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-2'>
                <Sparkles className='h-5 w-5 text-primary' />
                <div>
                  <CardTitle>AI Decisions Inbox</CardTitle>
                  <CardDescription>Review, approve, or reject AI-detected sales before they affect reporting.</CardDescription>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='secondary' className='gap-1'>
                  <ShieldCheck className='h-3.5 w-3.5' />
                  {reviewSummary.pendingCount} pending
                </Badge>
                <Badge
                  variant='outline'
                  className={cn(
                    reviewSummary.highRiskCount > 0
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  )}
                >
                  {reviewSummary.highRiskCount} high-risk
                </Badge>
                <Badge variant='outline'>
                  Avg confidence {(reviewSummary.averageConfidence * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {isSalesLoading ? (
              <div className='space-y-2'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='flex items-center gap-4 p-3'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='space-y-2 flex-1'>
                      <Skeleton className='h-4 w-48' />
                      <Skeleton className='h-3 w-64' />
                    </div>
                    <Skeleton className='h-9 w-24' />
                  </div>
                ))}
              </div>
            ) : (
              reviewInboxSales.map((sale) => {
                const leadContact = sale.lead?.contact;
                const displayName =
                  leadContact?.displayName || leadContact?.phone || 'Unknown';
                const confidence = sale.detectionConfidence
                  ? Math.round(sale.detectionConfidence * 100)
                  : 0;
                const risk = getConfidenceRisk(sale.detectionConfidence);
                const reasoning = sale.detectionReasoning?.trim();

                return (
                  <div
                    key={sale.id}
                    className='flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 lg:flex-row lg:items-center lg:justify-between'
                  >
                    <div className='flex items-start gap-3 min-w-0'>
                      <Avatar className='h-10 w-10 shrink-0'>
                        <AvatarFallback className='bg-primary/10 text-primary'>
                          {displayName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='font-medium truncate'>{displayName}</p>
                          <Badge variant='outline' className='text-xs'>
                            {confidence}% confidence
                          </Badge>
                          <Badge
                            variant='outline'
                            className={cn('text-xs', getRiskBadgeClass(risk))}
                          >
                            {risk} risk
                          </Badge>
                        </div>
                        <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                          <span className='font-semibold'>
                            {sale.currency} {sale.amount.toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>
                            {sale.items.length} item
                            {sale.items.length !== 1 ? 's' : ''}
                          </span>
                          {sale.detectionMetadata?.deliveryAddress && (
                            <>
                              <span>•</span>
                              <span className='truncate text-xs'>
                                {sale.detectionMetadata.deliveryAddress}
                              </span>
                            </>
                          )}
                        </div>
                        {reasoning && (
                          <p className='line-clamp-2 text-xs text-muted-foreground'>
                            AI reason: {reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setSelectedSale(sale)}
                      >
                        View Details
                      </Button>
                      {sale.status !== 'PAID' && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleMarkSalePaid(sale.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleRejectSale(sale.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => handleApproveSale(sale.id)}
                        className='bg-primary hover:bg-primary/90'
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {reviewSummary.highRiskCount > 0 && (
        <div className='flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800'>
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
          <p>
            {reviewSummary.highRiskCount} AI-detected sale
            {reviewSummary.highRiskCount === 1 ? '' : 's'} have low confidence.
            Prioritize manual review before approving.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Sales list</CardTitle>
              <CardDescription>Click any sale to open a dedicated detail page, just like templates.</CardDescription>
            </div>
          </div>
          <div className='flex flex-wrap gap-3'>
            <div className='relative flex-1 min-w-[200px]'>
              <Search className='h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Search people, labels, or notes'
                className='pl-9'
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: SalesBucketKey) => setStatusFilter(value)}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Bucket' />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as 'ALL' | Lead['source'])}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder='Channel' />
              </SelectTrigger>
              <SelectContent>
                {channelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className='hidden md:table-cell'>Stage</TableHead>
                  <TableHead className='hidden lg:table-cell'>Channel</TableHead>
                  <TableHead className='hidden md:table-cell'>Value</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableBody()}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isQuickCaptureOpen} onOpenChange={setIsQuickCaptureOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Quick capture sale</DialogTitle>
            <DialogDescription>
              Record a payment fast when a customer pays via chat and no invoice
              was created.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Lead ID</label>
              <Input
                value={quickCaptureLeadId}
                onChange={(event) => setQuickCaptureLeadId(event.target.value)}
                placeholder='Paste lead ID'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Amount</label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={quickCaptureAmount}
                  onChange={(event) => setQuickCaptureAmount(event.target.value)}
                  placeholder='0.00'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Currency</label>
                <Input
                  value={quickCaptureCurrency}
                  onChange={(event) =>
                    setQuickCaptureCurrency(event.target.value.toUpperCase())
                  }
                  placeholder='NGN'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Note (optional)</label>
              <Textarea
                value={quickCaptureNote}
                onChange={(event) => setQuickCaptureNote(event.target.value)}
                placeholder='Example: Paid via bank transfer'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsQuickCaptureOpen(false)}
              disabled={isQuickCapturing}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickCaptureSale} disabled={isQuickCapturing}>
              {isQuickCapturing ? 'Saving...' : 'Save as paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Detail Modal */}
      <SalesDetailModal
        sale={selectedSale}
        isOpen={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        onApprove={handleApproveSale}
        onReject={handleRejectSale}
        onUpdate={handleUpdateSale}
        onDelete={handleDeleteSale}
      />
    </div>
  );
};

export default SalesPage;
