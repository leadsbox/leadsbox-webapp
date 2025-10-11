// Pipeline Page Component for LeadsBox Dashboard

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, DollarSign, Calendar, User, Building, MoreHorizontal, Target, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Lead, Stage, LeadLabel, leadLabelUtils } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const PIPELINE_COLUMNS: Array<{ key: LeadLabel; title: string; color: string }> = [
  { key: 'NEW_LEAD', title: 'New Leads', color: 'bg-blue-500' },
  { key: 'ENGAGED', title: 'Engaged', color: 'bg-indigo-500' },
  { key: 'FOLLOW_UP_REQUIRED', title: 'Follow Up', color: 'bg-amber-500' },
  { key: 'TRANSACTION_IN_PROGRESS', title: 'In Progress', color: 'bg-purple-500' },
  { key: 'PAYMENT_PENDING', title: 'Payment Pending', color: 'bg-orange-500' },
  { key: 'TRANSACTION_SUCCESSFUL', title: 'Won', color: 'bg-green-500' },
  { key: 'CLOSED_LOST_TRANSACTION', title: 'Closed Lost', color: 'bg-red-500' },
];

const LEGACY_STAGE_MAP: Record<string, LeadLabel> = {
  NEW: 'NEW_LEAD',
  QUALIFIED: 'ENGAGED',
  IN_PROGRESS: 'TRANSACTION_IN_PROGRESS',
  WON: 'TRANSACTION_SUCCESSFUL',
  LOST: 'CLOSED_LOST_TRANSACTION',
};

const normalizeLabelToPipeline = (label?: string): LeadLabel => {
  if (!label) return 'NEW_LEAD';
  const normalized = label.toUpperCase();
  if (PIPELINE_COLUMNS.some((column) => column.key === normalized)) {
    return normalized as LeadLabel;
  }
  if (normalized in LEGACY_STAGE_MAP) {
    return LEGACY_STAGE_MAP[normalized];
  }
  return 'NEW_LEAD';
};

const mapStageToPipelineColumn = (stage: Stage): LeadLabel =>
  normalizeLabelToPipeline(stage);

const labelToPriority = (label?: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const labelUpper = (label || '').toUpperCase();

  if (
    labelUpper.includes('PAYMENT_PENDING') ||
    labelUpper.includes('FOLLOW_UP_REQUIRED') ||
    labelUpper.includes('DEMO_REQUEST') ||
    labelUpper.includes('TECHNICAL_SUPPORT')
  ) {
    return 'HIGH';
  }

  if (
    labelUpper.includes('FEEDBACK') ||
    labelUpper.includes('NOT_A_LEAD') ||
    labelUpper.includes('CLOSED_LOST_TRANSACTION')
  ) {
    return 'LOW';
  }

  return 'MEDIUM';
};

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

interface SortableLeadCardProps {
  lead: Lead;
  assignedUser?: PipelineAssignedUser;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ lead, assignedUser }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id, data: { stage: lead.stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className='cursor-grab active:cursor-grabbing'>
      <Card className='mb-3 hover:shadow-md transition-shadow'>
        <CardContent className='p-4'>
          <div className='flex items-start justify-between mb-3'>
            <h3 className='font-medium text-sm leading-tight'>{lead.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-6 w-6'>
                  <MoreHorizontal className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                <DropdownMenuItem>Send Message</DropdownMenuItem>
                <DropdownMenuItem className='text-destructive'>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='space-y-2 text-xs text-muted-foreground'>
            <div className='flex items-center'>
              <User className='h-3 w-3 mr-1' />
              <span>{lead.email}</span>
            </div>

            {lead.company && (
              <div className='flex items-center'>
                <Building className='h-3 w-3 mr-1' />
                <span>{lead.company}</span>
              </div>
            )}

            {lead.value && (
              <div className='flex items-center font-medium text-foreground'>
                <DollarSign className='h-3 w-3 mr-1' />
                <span>${lead.value.toLocaleString()}</span>
              </div>
            )}

            <div className='flex items-center'>
              <Calendar className='h-3 w-3 mr-1' />
              <span>{formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>

          <div className='flex items-center justify-between mt-3'>
            <Badge variant='outline' className={getPriorityColor(lead.priority)}>
              {lead.priority}
            </Badge>

            {assignedUser ? (
              <Avatar className='h-6 w-6'>
                {assignedUser.avatar ? (
                  <AvatarImage src={assignedUser.avatar} />
                ) : (
                  <AvatarFallback className='text-xs'>
                    {assignedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            ) : null}
          </div>

          {lead.tags.length > 0 && (
            <div className='flex flex-wrap gap-1 mt-2'>
              {lead.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant='outline' className={`text-xs px-1 py-0 ${leadLabelUtils.getLabelStyling(tag as LeadLabel)}`}>
                  {leadLabelUtils.isValidLabel(tag) ? leadLabelUtils.getDisplayName(tag as LeadLabel) : tag}
                </Badge>
              ))}
              {lead.tags.length > 2 && (
                <Badge variant='outline' className='text-xs px-1 py-0 bg-slate-50 text-slate-700 border border-slate-200'>
                  +{lead.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface PipelineStageProps {
  stage: LeadLabel;
  title: string;
  leads: Lead[];
  color: string;
  resolveAssignedUser: (userId?: string | null) => PipelineAssignedUser | undefined;
}

const PipelineStage: React.FC<PipelineStageProps> = ({ stage, title, leads, color, resolveAssignedUser }) => {
  const droppableId = `column-${stage}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);

  return (
    <div ref={setNodeRef} className={`flex-1 min-w-80 transition-colors ${isOver ? 'bg-muted/40 rounded-lg' : ''}`}>
      <Card className='h-full'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <div className={`w-3 h-3 rounded-full ${color}`}></div>
              <CardTitle className='text-sm font-medium'>{title}</CardTitle>
              <Badge variant='secondary' className='text-xs'>
                {leads.length}
              </Badge>
            </div>
            <Button variant='ghost' size='icon' className='h-6 w-6'>
              <Plus className='h-3 w-3' />
            </Button>
          </div>
          {totalValue > 0 && <div className='text-xs text-muted-foreground'>Total: ${totalValue.toLocaleString()}</div>}
        </CardHeader>
        <CardContent className='pt-0'>
          <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className='space-y-3 max-h-[calc(100vh-300px)] overflow-auto'>
              {leads.map((lead) => (
                <SortableLeadCard
                  key={lead.id}
                  lead={lead}
                  assignedUser={resolveAssignedUser(lead.assignedTo)}
                />
              ))}
              {leads.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  <Target className='h-8 w-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>No leads in this stage</p>
                  <Button variant='ghost' size='sm' className='mt-2'>
                    <Plus className='h-3 w-3 mr-1' />
                    Add Lead
                  </Button>
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
};

const PipelinePage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { members, getMemberByUserId } = useOrgMembers();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await client.get(endpoints.leads);
      const list: BackendLead[] = response?.data?.data?.leads || response?.data || [];

      const mapped: Lead[] = list.map((l) => {
        const normalizedLabel = normalizeLabelToPipeline(l.label);
        return {
          id: l.id,
          name: l.providerId ? `Lead ${String(l.providerId).slice(0, 6)}` : l.conversationId || 'Lead',
          email: l.user?.email || '',
          phone: undefined,
          company: undefined,
          source: (String(l.provider || 'manual').toLowerCase() as Lead['source']) || 'manual',
          stage: normalizedLabel,
          priority: labelToPriority(l.label),
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
    } catch (error: any) {
      console.error('Failed to load pipeline leads', error);
      setLeads([]);
      toast({
        title: 'Unable to load pipeline',
        description:
          error?.response?.data?.message || error?.message || 'Try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const resolveAssignedUser = useCallback(
    (userId?: string | null): PipelineAssignedUser | undefined => {
      if (!userId) return undefined;
      const member = getMemberByUserId(userId);
      if (!member) return undefined;

      const { user } = member;
      const fullName = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(' ');
      const name =
        fullName || user?.username || user?.email || 'Team member';

      return {
        id: member.userId,
        name,
        avatar: user?.profileImage ?? null,
      };
    },
    [getMemberByUserId]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedLead = leads.find((lead) => lead.id === activeId);
    if (!draggedLead) return;

    const currentColumn = mapStageToPipelineColumn(draggedLead.stage);

    let targetColumn: LeadLabel | null = null;

    if (overId.startsWith('column-')) {
      targetColumn = normalizeLabelToPipeline(overId.replace('column-', ''));
    } else {
      const overStage = over?.data?.current?.stage as Stage | undefined;
      if (overStage) {
        targetColumn = mapStageToPipelineColumn(overStage);
      } else {
        const overLead = leads.find((lead) => lead.id === overId);
        if (overLead) {
          targetColumn = mapStageToPipelineColumn(overLead.stage);
        }
      }
    }

    if (!targetColumn) {
      return;
    }

    if (targetColumn === currentColumn) {
      const overLead = leads.find((lead) => lead.id === overId);
      if (overLead && overLead.id !== draggedLead.id) {
        const activeIndex = leads.findIndex((lead) => lead.id === draggedLead.id);
        const overIndex = leads.findIndex((lead) => lead.id === overLead.id);
        if (activeIndex !== -1 && overIndex !== -1) {
          setLeads((prevLeads) => arrayMove(prevLeads, activeIndex, overIndex));
        }
      }
      return;
    }

    const note =
      typeof window !== 'undefined'
        ? window.prompt('Add an optional note for this move', '')
        : '';

    const previousState = leads;
    const updatedAt = new Date().toISOString();

    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === activeId
          ? {
              ...lead,
              stage: targetColumn!,
              label: targetColumn!,
              tags: [targetColumn!],
              updatedAt,
            }
          : lead
      )
    );

    try {
      await client.post(endpoints.moveLead(activeId), {
        label: targetColumn,
        note: note && note.trim().length > 0 ? note.trim() : undefined,
      });

      toast({
        title: 'Lead updated',
        description: `Moved ${draggedLead.name} to ${leadLabelUtils.getDisplayName(targetColumn)}`,
      });

      await fetchLeads();
    } catch (error: any) {
      console.error('Failed to move lead', error);
      setLeads(previousState);
      toast({
        title: 'Failed to move lead',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate pipeline stats
  const pipelineStats = useMemo(() => {
    const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const totalLeads = leads.length;
    const wonCount = leads.filter((lead) => lead.stage === 'TRANSACTION_SUCCESSFUL').length;
    const avgDealSize = totalLeads > 0 ? totalValue / totalLeads : 0;
    const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;

    return {
      totalValue,
      totalLeads,
      conversionRate,
      avgDealSize,
    };
  }, [leads]);

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Sales Pipeline</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Track deals through your sales process</p>
        </div>
        <Button>
          <Plus className='h-4 w-4 mr-2' />
          Add Lead
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <DollarSign className='h-4 w-4 mr-2' />
              Total Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${pipelineStats.totalValue.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <Target className='h-4 w-4 mr-2' />
              Total Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pipelineStats.totalLeads}</div>
            <p className='text-xs text-muted-foreground'>+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <TrendingUp className='h-4 w-4 mr-2' />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pipelineStats.conversionRate.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground'>+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <DollarSign className='h-4 w-4 mr-2' />
              Avg Deal Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${pipelineStats.avgDealSize.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <div className='min-h-[540px] sm:min-h-[600px]'>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`pipeline-skeleton-${index}`} className='h-[420px]'>
                  <CardHeader className='pb-2'>
                    <Skeleton className='h-4 w-32' />
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {Array.from({ length: 4 }).map((__, cardIndex) => (
                      <Skeleton key={`pipeline-card-skeleton-${index}-${cardIndex}`} className='h-24 w-full rounded-md' />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='flex gap-6 overflow-x-auto pb-6'>
              {PIPELINE_COLUMNS.map((column) => {
                const stageLeads = leads.filter(
                  (lead) => mapStageToPipelineColumn(lead.stage) === column.key
                );

                return (
                  <PipelineStage
                    key={column.key}
                    stage={column.key}
                    title={column.title}
                    leads={stageLeads}
                    color={column.color}
                    resolveAssignedUser={resolveAssignedUser}
                  />
                );
              })}
            </div>
          )}
        </DndContext>
      </div>
    </div>
  );
};

export default PipelinePage;
