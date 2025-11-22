import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Filter, MessageSquare, Search, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Lead, LeadLabel, leadLabelUtils } from '@/types';
import { notify } from '@/lib/toast';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { useNavigate } from 'react-router-dom';

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

const SalesPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesBucketKey>('SALES');
  const [channelFilter, setChannelFilter] = useState<'ALL' | Lead['source']>('ALL');
  const { getMemberByUserId } = useOrgMembers();
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleUpdateStatus = useCallback(
    async (leadId: string, newLabel: LeadLabel) => {
      try {
        // Optimistic update
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === leadId ? { ...lead, stage: newLabel, label: newLabel } : lead
          )
        );

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
        notify.error({
          key: `lead-update-error-${leadId}`,
          title: 'Update failed',
          description: 'Unable to change status. Please try again.',
        });
        // Revert optimistic update
        await fetchLeads();
      }
    },
    [fetchLeads]
  );

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
    [getMemberByUserId]
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
    const totalSales = groupedLeads.SALES.length;
    const inquiries = groupedLeads.INQUIRIES.length;
    const pending = groupedLeads.PENDING.length;
    const closed = groupedLeads.CLOSED.length;
    return [
      {
        label: 'Recorded sales',
        value: totalSales,
        change: groupedLeads.SALES.filter((lead) => new Date(lead.updatedAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7).length,
        helper: 'Last 7 days',
        icon: ShoppingBag,
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
  }, [groupedLeads]);

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
            <Select
              value={lead.stage}
              onValueChange={(value) => handleUpdateStatus(lead.id, value as LeadLabel)}
            >
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
        <Button variant='outline' onClick={fetchLeads} disabled={isLoading && leads.length === 0}>
          <Filter className='h-4 w-4 mr-2' />
          Refresh data
        </Button>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPage;
