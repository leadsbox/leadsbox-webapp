// Leads Page Component for LeadsBox Dashboard

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Building,
  Tag,
  Calendar,
  DollarSign,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Lead, Stage, LeadLabel, leadLabelUtils } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { WhatsAppIcon, TelegramIcon } from '@/components/brand-icons';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { notify } from '@/lib/toast';
import { trackAppEvent } from '@/lib/productTelemetry';
import { Skeleton } from '../../components/ui/skeleton';
import { useOrgMembers } from '@/hooks/useOrgMembers';

// Backend lead type
interface BackendLead {
  id: string;
  organizationId: string;
  conversationId?: string;
  threadId?: string;
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
  contact?: {
    id: string;
    displayName?: string | null;
    phone?: string | null;
    email?: string | null;
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

const PIPELINE_STAGES: Stage[] = [
  'NEW_LEAD',
  'ENGAGED',
  'FOLLOW_UP_REQUIRED',
  'TRANSACTION_IN_PROGRESS',
  'PAYMENT_PENDING',
  'TRANSACTION_SUCCESSFUL',
  'CLOSED_LOST_TRANSACTION',
];

const LEGACY_STAGE_MAP: Record<string, Stage> = {
  NEW: 'NEW_LEAD',
  QUALIFIED: 'ENGAGED',
  IN_PROGRESS: 'TRANSACTION_IN_PROGRESS',
  WON: 'TRANSACTION_SUCCESSFUL',
  LOST: 'CLOSED_LOST_TRANSACTION',
};

const LeadsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadSource, setNewLeadSource] = useState<Lead['source']>('whatsapp');
  const [newLeadStage, setNewLeadStage] = useState<Stage>('NEW_LEAD');
  const [createdLeadForNextSteps, setCreatedLeadForNextSteps] = useState<Lead | null>(null);
  const { members, isLoading: membersLoading, getMemberByUserId } = useOrgMembers();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const stageFilters = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All' },
      ...PIPELINE_STAGES.map((stage) => ({
        value: stage,
        label: leadLabelUtils.getDisplayName(stage as LeadLabel),
      })),
    ],
    []
  );

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: leads.length,
    };

    PIPELINE_STAGES.forEach((stage) => {
      counts[stage] = leads.filter((lead) => lead.stage === stage).length;
    });

    return counts;
  }, [leads]);

  const labelToStage = useCallback((label?: string): Stage => {
    if (!label) return 'NEW_LEAD';
    const normalized = label.toUpperCase();
    if (PIPELINE_STAGES.includes(normalized as Stage)) {
      return normalized as Stage;
    }
    if (normalized in LEGACY_STAGE_MAP) {
      return LEGACY_STAGE_MAP[normalized];
    }
    return 'NEW_LEAD';
  }, []);

  const labelToPriority = useCallback((label?: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
    const labelUpper = (label || '').toUpperCase();

    // High priority labels that need immediate attention
    if (
      labelUpper.includes('PAYMENT_PENDING') ||
      labelUpper.includes('FOLLOW_UP_REQUIRED') ||
      labelUpper.includes('DEMO_REQUEST') ||
      labelUpper.includes('TECHNICAL_SUPPORT')
    ) {
      return 'HIGH';
    }

    // Low priority labels
    if (labelUpper.includes('FEEDBACK') || labelUpper.includes('NOT_A_LEAD') || labelUpper.includes('CLOSED_LOST_TRANSACTION')) {
      return 'LOW';
    }

    // Default to medium for everything else
    return 'MEDIUM';
  }, []);

  const resolveSource = useCallback((provider?: string): Lead['source'] => {
    const normalized = String(provider || 'manual').toLowerCase();
    if (
      normalized === 'whatsapp' ||
      normalized === 'telegram' ||
      normalized === 'instagram' ||
      normalized === 'website' ||
      normalized === 'manual'
    ) {
      return normalized;
    }
    return 'manual';
  }, []);

  const mapBackendLeadToUi = useCallback(
    (lead: BackendLead): Lead => {
      const normalizedLabel = lead.label
        ? (lead.label.toUpperCase() as LeadLabel)
        : undefined;
      const stage = labelToStage(lead.label);
      const assignedUserId = lead.user?.id || lead.userId || '';
      const displayName =
        lead.contact?.displayName ||
        (lead.providerId
          ? `Lead ${String(lead.providerId).slice(0, 6)}`
          : lead.conversationId || 'Lead');

      return {
        id: lead.id,
        name: displayName,
        email: lead.contact?.email || lead.user?.email || '',
        phone: lead.contact?.phone || undefined,
        company: undefined,
        source: resolveSource(lead.provider),
        stage,
        priority: labelToPriority(lead.label),
        tags: normalizedLabel ? [normalizedLabel] : [],
        assignedTo: assignedUserId,
        value: undefined,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        lastActivity: lead.lastMessageAt,
        conversationId: lead.conversationId,
        threadId: lead.threadId,
        providerId: lead.providerId,
        contactId: lead.contact?.id,
        from:
          lead.contact?.phone ||
          lead.contact?.email ||
          lead.providerId ||
          lead.conversationId,
        label: normalizedLabel,
        notes: lead.notes?.[0]?.note || '',
        noteHistory:
          lead.notes?.map((note) => ({
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
    },
    [labelToPriority, labelToStage, resolveSource]
  );

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const resp = await client.get(endpoints.leads);
      const list: BackendLead[] = resp?.data?.data?.leads || resp?.data || [];
      const mapped = list.map(mapBackendLeadToUi);
      setLeads(mapped);
    } catch (error) {
      console.error('Failed to load leads', error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapBackendLeadToUi]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (searchParams.get('quickAdd') !== '1') {
      return;
    }

    setIsCreateLeadOpen(true);
    setCreatedLeadForNextSteps(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('quickAdd');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const resetCreateLeadForm = useCallback(() => {
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadEmail('');
    setNewLeadSource('whatsapp');
    setNewLeadStage('NEW_LEAD');
  }, []);

  const closeCreateLeadModal = useCallback(() => {
    setIsCreateLeadOpen(false);
    resetCreateLeadForm();
    setCreatedLeadForNextSteps(null);
  }, [resetCreateLeadForm]);

  const openSendFirstReply = useCallback(
    (lead: Lead) => {
      const phoneSeed = lead.phone || '';
      if (!phoneSeed) {
        notify.warning({
          key: `leads:${lead.id}:missing-contact`,
          title: 'Phone number required',
          description: 'Add a phone number to start a chat from inbox.',
        });
        return;
      }
      const greetingName = lead.name?.trim() || 'there';
      const suggestedMessage = `Hi ${greetingName}, thanks for reaching out to us. How can we help you today?`;
      const params = new URLSearchParams({
        startChat: '1',
        phone: phoneSeed,
        text: suggestedMessage,
        leadId: lead.id,
        leadName: lead.name || 'Customer',
      });
      navigate(`/dashboard/inbox?${params.toString()}`);
      closeCreateLeadModal();
    },
    [closeCreateLeadModal, navigate]
  );

  const openScheduleFollowUp = useCallback(
    (lead: Lead) => {
      const providerSeed =
        lead.source === 'whatsapp' || lead.source === 'instagram' || lead.source === 'telegram'
          ? lead.source
          : 'whatsapp';
      const params = new URLSearchParams({
        quickFollowUp: '1',
        leadId: lead.id,
        leadName: lead.name || 'Customer',
        provider: providerSeed,
        conversationId: lead.threadId || lead.conversationId || '',
        phone: lead.phone || '',
      });
      navigate(`/dashboard/automations?${params.toString()}`);
      closeCreateLeadModal();
    },
    [closeCreateLeadModal, navigate]
  );

  const openQuickCapture = useCallback(
    (lead: Lead) => {
      const params = new URLSearchParams({
        quickCapture: '1',
        leadId: lead.id,
        status: 'PAID',
        customer: lead.name || 'Customer',
      });
      navigate(`/dashboard/sales?${params.toString()}`);
      closeCreateLeadModal();
    },
    [closeCreateLeadModal, navigate]
  );

  const handleCreateLead = useCallback(async () => {
    const normalizedName = newLeadName.trim();
    const normalizedPhone = newLeadPhone.trim();
    const normalizedEmail = newLeadEmail.trim().toLowerCase();
    if (!normalizedPhone && !normalizedEmail) {
      notify.error({
        key: 'leads:create:missing-contact',
        title: 'Phone or email required',
        description: 'Add at least a phone number or email so the lead can be contacted.',
      });
      return;
    }

    const seed =
      normalizedPhone ||
      normalizedEmail ||
      normalizedName.toLowerCase().replace(/\s+/g, '-') ||
      `lead-${Date.now()}`;
    const conversationId = `manual:${newLeadSource}:${seed}:${Date.now()}`;

    try {
      setIsCreatingLead(true);
      const response = await client.post(endpoints.leads, {
        conversationId,
        provider: newLeadSource,
        providerId: seed,
        label: newLeadStage,
        lastMessageAt: new Date().toISOString(),
        contactName: normalizedName || undefined,
        contactPhone: normalizedPhone || undefined,
        contactEmail: normalizedEmail || undefined,
      });

      const payload = response?.data?.data || response?.data;
      if (payload?.id) {
        const createdLead = mapBackendLeadToUi(payload as BackendLead);
        setLeads((prev) => [createdLead, ...prev.filter((lead) => lead.id !== createdLead.id)]);
        setCreatedLeadForNextSteps(createdLead);
      } else {
        await fetchLeads();
        setCreatedLeadForNextSteps(null);
      }

      trackAppEvent('manual_lead_created', {
        source: newLeadSource,
        stage: newLeadStage,
        hasPhone: Boolean(normalizedPhone),
        hasEmail: Boolean(normalizedEmail),
      });
      notify.success({
        key: 'leads:create:success',
        title: 'Lead added',
        description: 'Your lead is now in pipeline and ready for follow-up.',
      });
      resetCreateLeadForm();
    } catch (error) {
      console.error('Failed to create lead', error);
      trackAppEvent('manual_lead_create_failed', {
        source: newLeadSource,
      });
      notify.error({
        key: 'leads:create:failed',
        title: 'Could not add lead',
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsCreatingLead(false);
    }
  }, [
    fetchLeads,
    mapBackendLeadToUi,
    newLeadEmail,
    newLeadName,
    newLeadPhone,
    newLeadSource,
    newLeadStage,
    resetCreateLeadForm,
  ]);

  const isDataLoading = isLoading || membersLoading;

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesSearch =
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStage = stageFilter === 'ALL' || lead.stage === stageFilter;

        return matchesSearch && matchesStage;
      }),
    [leads, searchQuery, stageFilter]
  );

  const engagedCount = useMemo(
    () =>
      leads.filter((lead) =>
        ['ENGAGED', 'FOLLOW_UP_REQUIRED', 'TRANSACTION_IN_PROGRESS'].includes(
          lead.stage
        )
      ).length,
    [leads]
  );

  const wonCount = useMemo(
    () =>
      leads.filter((lead) => lead.stage === 'TRANSACTION_SUCCESSFUL').length,
    [leads]
  );

  const lostCount = useMemo(
    () =>
      leads.filter((lead) => lead.stage === 'CLOSED_LOST_TRANSACTION').length,
    [leads]
  );

  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case 'NEW_LEAD':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ENGAGED':
      case 'FOLLOW_UP_REQUIRED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'TRANSACTION_IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PAYMENT_PENDING':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'TRANSACTION_SUCCESSFUL':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'CLOSED_LOST_TRANSACTION':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PRICING_INQUIRY':
      case 'DEMO_REQUEST':
      case 'NEW_INQUIRY':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'TECHNICAL_SUPPORT':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'PARTNERSHIP_OPPORTUNITY':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'FEEDBACK':
        return 'bg-lime-500/10 text-lime-500 border-lime-500/20';
      case 'NOT_A_LEAD':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: Lead['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getSourceIcon = (source: Lead['source']) => {
    switch (source) {
      case 'whatsapp':
        return <WhatsAppIcon className='h-4 w-4' />;
      case 'telegram':
        return <TelegramIcon className='h-4 w-4' />;
      case 'website':
        return (
          <span role='img' aria-label='website'>
            🌐
          </span>
        );
      case 'manual':
        return (
          <span role='img' aria-label='manual'>
            📝
          </span>
        );
      default:
        return (
          <span role='img' aria-label='manual'>
            📝
          </span>
        );
    }
  };

  const getAssignedUser = useCallback(
    (userId?: string | null) => {
      if (!userId) return undefined;

      const member = getMemberByUserId(userId);
      if (!member) return undefined;

      const { user } = member;
      const fullName = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(' ');
      const displayName =
        fullName || user?.username || user?.email || 'Team member';

      return {
        id: member.userId,
        name: displayName,
        avatar: user?.profileImage ?? undefined,
        email: user?.email ?? undefined,
      };
    },
    [getMemberByUserId]
  );

  const handleLeadSelection = (lead: Lead) => {
    navigate(`/dashboard/leads/${lead.id}`);
  };

  const handleWhatsAppClick = (lead: Lead) => {
    // Navigate to WhatsApp conversation
    // This will depend on how your WhatsApp integration works
    // For now, we'll construct a URL or trigger a navigation
    if (lead.source === 'whatsapp') {
      // Extract conversation/provider ID from lead data
      // We'll need to store this data when we create the lead
      const leadData = lead as Lead & { conversationId?: string; providerId?: string };
      const conversationId = leadData.conversationId || leadData.providerId;
      if (conversationId) {
        // Navigate to inbox with this conversation selected
        window.location.href = `/dashboard/inbox?conversation=${conversationId}`;
      } else {
        notify.warning({
          key: `leads:whatsapp:${lead.id}:missing`,
          title: 'Conversation not found',
          description: 'Unable to locate the original WhatsApp conversation.',
        });
      }
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Leads</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Manage and track your leads</p>
        </div>
        <Button
          onClick={() => {
            setCreatedLeadForNextSteps(null);
            setIsCreateLeadOpen(true);
          }}
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Lead
        </Button>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search leads...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10' />
        </div>

        <Select
          value={stageFilter}
          onValueChange={(value) => setStageFilter(value as Stage | 'ALL')}
        >
          <SelectTrigger className='w-full sm:w-[220px]'>
            <SelectValue placeholder='All stages' />
          </SelectTrigger>
          <SelectContent align='end'>
            {stageFilters.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                <div className='flex items-center justify-between gap-4'>
                  <span>{label}</span>
                  <span className='text-xs text-muted-foreground'>
                    {stageCounts[value] ?? 0}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant='outline'>
          <Filter className='h-4 w-4 mr-2' />
          Filter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {isDataLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`lead-stat-skeleton-${index}`} className='h-full'>
                <CardHeader className='pb-2 space-y-2'>
                  <Skeleton className='h-4 w-24' />
                </CardHeader>
                <CardContent className='space-y-2'>
                  <Skeleton className='h-7 w-16' />
                  <Skeleton className='h-3 w-32' />
                </CardContent>
              </Card>
            ))
          : (
              <>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium'>Total Leads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{leads.length}</div>
                    <p className='text-xs text-muted-foreground'>+12% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium'>Active Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{engagedCount}</div>
                    <p className='text-xs text-muted-foreground'>Leads currently in motion</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium'>Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>24.5%</div>
                    <p className='text-xs text-muted-foreground'>+2.1% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium'>Recent Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-sm text-muted-foreground space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span>Won</span>
                        <span className='font-semibold text-green-500'>{wonCount}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span>Lost</span>
                        <span className='font-semibold text-red-500'>{lostCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isDataLoading ? <Skeleton className='h-6 w-32' /> : `Leads (${filteredLeads.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table className='min-w-[800px]'>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`lead-row-skel-${index}`}>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Skeleton className='h-8 w-8 rounded-full' />
                        <div className='space-y-2'>
                          <Skeleton className='h-4 w-28' />
                          <Skeleton className='h-3 w-20' />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        <Skeleton className='h-6 w-6 rounded-full' />
                        <Skeleton className='h-4 w-20' />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-6' />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className='h-36 text-center text-muted-foreground'>
                    <div className='space-y-2'>
                      <p>No leads match your filters yet.</p>
                      <Button
                        size='sm'
                        onClick={() => {
                          setCreatedLeadForNextSteps(null);
                          setIsCreateLeadOpen(true);
                        }}
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Add your first lead
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const assignedUser = getAssignedUser(lead.assignedTo || '');

                  return (
                    <TableRow key={lead.id} className='cursor-pointer hover:bg-muted/50' onClick={() => handleLeadSelection(lead)}>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='bg-primary/10 text-primary'>{lead.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>{lead.name}</div>
                          <div className='text-sm text-muted-foreground'>{lead.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        {getSourceIcon(lead.source)}
                        <span className='capitalize text-sm ml-1'>{lead.source}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {(() => {
                          const leadData = lead as Lead & { from?: string; providerId?: string; conversationId?: string };
                          return leadData.from || leadData.providerId || leadData.conversationId || '—';
                        })()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={getStageColor(lead.stage)}>
                        {leadLabelUtils.isValidLabel(lead.stage as LeadLabel)
                          ? leadLabelUtils.getDisplayName(lead.stage as LeadLabel)
                          : lead.stage.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {lead.tags.map((tag, index) => (
                          <Badge key={index} variant='outline' className={`text-xs ${leadLabelUtils.getLabelStyling(tag as LeadLabel)}`}>
                            {leadLabelUtils.isValidLabel(tag) ? leadLabelUtils.getDisplayName(tag as LeadLabel) : tag}
                          </Badge>
                        ))}
                        {lead.tags.length === 0 && <span className='text-sm text-muted-foreground'>—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignedUser ? (
                        <div className='flex items-center space-x-2'>
                          <Avatar className='h-6 w-6'>
                            {assignedUser.avatar ? (
                              <AvatarImage src={assignedUser.avatar} />
                            ) : (
                              <AvatarFallback className='text-xs'>
                                {assignedUser.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className='text-sm'>{assignedUser.name}</span>
                        </div>
                      ) : (
                        <span className='text-sm text-muted-foreground'>Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {lead.lastActivity && formatDistanceToNow(new Date(lead.lastActivity), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={(event) => {
                          event.stopPropagation();
                          handleLeadSelection(lead);
                        }}
                      >
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isCreateLeadOpen}
        onOpenChange={(open) => {
          if (!isCreatingLead) {
            if (!open) {
              setCreatedLeadForNextSteps(null);
            }
            setIsCreateLeadOpen(open);
          }
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{createdLeadForNextSteps ? 'Lead created' : 'Add lead manually'}</DialogTitle>
            <DialogDescription>
              {createdLeadForNextSteps
                ? 'Keep momentum. Complete one of these actions to reach first value quickly.'
                : 'Add a lead instantly so your team can follow up and record sales from day one.'}
            </DialogDescription>
          </DialogHeader>

          {createdLeadForNextSteps ? (
            <div className='space-y-3'>
              <div className='rounded-lg border bg-muted/30 p-3 text-sm'>
                <div className='font-medium'>{createdLeadForNextSteps.name || 'Lead'}</div>
                <div className='text-muted-foreground'>
                  {createdLeadForNextSteps.phone || createdLeadForNextSteps.email || createdLeadForNextSteps.providerId || 'No contact details'}
                </div>
              </div>
              <div className='grid grid-cols-1 gap-2'>
                <Button onClick={() => openSendFirstReply(createdLeadForNextSteps)}>Send first reply</Button>
                <Button variant='secondary' onClick={() => openScheduleFollowUp(createdLeadForNextSteps)}>
                  Schedule follow-up
                </Button>
                <Button variant='outline' onClick={() => openQuickCapture(createdLeadForNextSteps)}>
                  Record first sale
                </Button>
                <Button variant='ghost' onClick={() => navigate(`/dashboard/leads/${createdLeadForNextSteps.id}`)}>
                  View lead details
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='manual-lead-name'>Customer name (optional)</Label>
                <Input
                  id='manual-lead-name'
                  placeholder='Jane Doe'
                  value={newLeadName}
                  onChange={(event) => setNewLeadName(event.target.value)}
                  disabled={isCreatingLead}
                />
              </div>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='manual-lead-phone'>Phone number</Label>
                  <Input
                    id='manual-lead-phone'
                    placeholder='+2348012345678'
                    value={newLeadPhone}
                    onChange={(event) => setNewLeadPhone(event.target.value)}
                    disabled={isCreatingLead}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='manual-lead-email'>Email</Label>
                  <Input
                    id='manual-lead-email'
                    type='email'
                    placeholder='customer@example.com'
                    value={newLeadEmail}
                    onChange={(event) => setNewLeadEmail(event.target.value)}
                    disabled={isCreatingLead}
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='manual-lead-source'>Source</Label>
                  <Select
                    value={newLeadSource}
                    onValueChange={(value) => setNewLeadSource(value as Lead['source'])}
                    disabled={isCreatingLead}
                  >
                    <SelectTrigger id='manual-lead-source'>
                      <SelectValue placeholder='Select source' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='whatsapp'>WhatsApp</SelectItem>
                      <SelectItem value='instagram'>Instagram</SelectItem>
                      <SelectItem value='telegram'>Telegram</SelectItem>
                      <SelectItem value='website'>Website</SelectItem>
                      <SelectItem value='manual'>Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='manual-lead-stage'>Starting stage</Label>
                  <Select
                    value={newLeadStage}
                    onValueChange={(value) => setNewLeadStage(value as Stage)}
                    disabled={isCreatingLead}
                  >
                    <SelectTrigger id='manual-lead-stage'>
                      <SelectValue placeholder='Select stage' />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {leadLabelUtils.getDisplayName(stage as LeadLabel)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className='text-xs text-muted-foreground'>
                Add at least phone or email. We use this to keep your pipeline and follow-ups reliable.
              </p>
            </div>
          )}

          <DialogFooter>
            {createdLeadForNextSteps ? (
              <Button variant='outline' onClick={closeCreateLeadModal}>
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={closeCreateLeadModal}
                  disabled={isCreatingLead}
                >
                  Cancel
                </Button>
                <Button onClick={() => void handleCreateLead()} disabled={isCreatingLead}>
                  {isCreatingLead ? 'Adding lead...' : 'Add lead'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsPage;
