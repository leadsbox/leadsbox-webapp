// Leads Page Component for LeadsBox Dashboard

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Skeleton } from '../../components/ui/skeleton';
import { useOrgMembers } from '@/hooks/useOrgMembers';

// Backend lead type
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
  const { members, isLoading: membersLoading, getMemberByUserId } = useOrgMembers();
  const navigate = useNavigate();

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

  const labelToStage = (label?: string): Stage => {
    if (!label) return 'NEW_LEAD';
    const normalized = label.toUpperCase();
    if (PIPELINE_STAGES.includes(normalized as Stage)) {
      return normalized as Stage;
    }
    if (normalized in LEGACY_STAGE_MAP) {
      return LEGACY_STAGE_MAP[normalized];
    }
    return 'NEW_LEAD';
  };

  const labelToPriority = (label?: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
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
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const resp = await client.get(endpoints.leads);
        const list: BackendLead[] = resp?.data?.data?.leads || resp?.data || [];
        const mapped: Lead[] = list.map((l: BackendLead) => {
          const normalizedLabel = l.label ? (l.label.toUpperCase() as LeadLabel) : undefined;
          const stage = labelToStage(l.label);
          const assignedUserId = l.user?.id || l.userId || '';

          return {
            id: l.id,
            name: l.providerId ? `Lead ${String(l.providerId).slice(0, 6)}` : l.conversationId || 'Lead',
            email: l.user?.email || '',
            phone: undefined,
            company: undefined,
            source: (String(l.provider || 'manual').toLowerCase() as Lead['source']) || 'manual',
            stage,
            priority: labelToPriority(l.label),
            tags: normalizedLabel ? [normalizedLabel] : [],
            assignedTo: assignedUserId,
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
      } catch (e) {
        console.error('Failed to load leads', e);
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
        <Button>
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
                  <TableCell colSpan={9} className='h-24 text-center text-muted-foreground'>
                    No leads match your filters yet.
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
    </div>
  );
};

export default LeadsPage;
