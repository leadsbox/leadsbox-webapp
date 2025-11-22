import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Save,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Lead, LeadLabel, leadLabelUtils } from '@/types';
import { notify } from '@/lib/toast';
import { useOrgMembers } from '@/hooks/useOrgMembers';

interface BackendLead {
  id: string;
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

const mapBackendLead = (payload: BackendLead): Lead => {
  const normalizedLabel = normalizeLabelToStage(payload.label);
  return {
    id: payload.id,
    name: payload.providerId
      ? `Lead ${String(payload.providerId).slice(0, 6)}`
      : payload.conversationId || 'Lead',
    email: payload.user?.email || '',
    phone: undefined,
    company: undefined,
    source:
      (String(payload.provider || 'manual').toLowerCase() as Lead['source']) ||
      'manual',
    stage: normalizedLabel,
    priority: 'MEDIUM',
    tags: normalizedLabel ? [normalizedLabel] : [],
    assignedTo: payload.user?.id || payload.userId || '',
    value: undefined,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    lastActivity: payload.lastMessageAt,
    conversationId: payload.conversationId,
    providerId: payload.providerId,
    from: payload.providerId || payload.conversationId,
    label: normalizedLabel,
    notes: payload.notes?.[0]?.note || '',
    noteHistory:
      payload.notes?.map((note) => ({
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
};

const SaleDetailPage: React.FC = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const { members, getMemberByUserId } = useOrgMembers();

  const [sale, setSale] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNote, setNewNote] = useState('');

  const loadSale = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!saleId) return;
      try {
        if (options?.silent) {
          setSilentLoading(true);
        } else {
          setIsLoading(true);
        }
        const response = await client.get(endpoints.lead(saleId));
        const payload: BackendLead | undefined =
          response?.data?.data?.lead || response?.data?.lead || response?.data;
        if (!payload) {
          throw new Error('Sale not found');
        }
        setSale(mapBackendLead(payload));
      } catch (error) {
        console.error('Failed to load sale', error);
        setSale(null);
        notify.error({
          key: `sales:${saleId}:detail`,
          title: 'Unable to load sale',
          description: 'Try refreshing this page.',
        });
      } finally {
        if (options?.silent) {
          setSilentLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [saleId]
  );

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  const handleStatusChange = async (newStage: string) => {
    if (!sale) return;
    try {
      setIsSaving(true);
      await client.put(endpoints.lead(sale.id), { label: newStage });
      setSale((prev) => (prev ? { ...prev, stage: newStage as LeadLabel } : null));
      notify.success({
        key: 'sale-status-update',
        title: 'Status updated',
        description: `Sale moved to ${leadLabelUtils.getDisplayName(newStage as LeadLabel)}`,
      });
    } catch (error) {
      console.error('Failed to update status', error);
      notify.error({
        key: 'sale-status-error',
        title: 'Update failed',
        description: 'Could not update sale status.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    if (!sale) return;
    try {
      setIsSaving(true);
      await client.put(endpoints.lead(sale.id), { assignedUserId: userId });
      setSale((prev) => (prev ? { ...prev, assignedTo: userId } : null));
      notify.success({
        key: 'sale-assign-update',
        title: 'Owner updated',
        description: 'Sale reassigned successfully.',
      });
    } catch (error) {
      console.error('Failed to update assignee', error);
      notify.error({
        key: 'sale-assign-error',
        title: 'Update failed',
        description: 'Could not reassign sale.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!sale || !newNote.trim()) return;
    try {
      setIsSaving(true);
      await client.post(`${endpoints.leads}/${sale.id}/move`, {
        label: sale.stage,
        note: newNote,
      });
      setNewNote('');
      notify.success({
        key: 'sale-note-added',
        title: 'Note added',
        description: 'Your note has been saved.',
      });
      loadSale({ silent: true });
    } catch (error) {
      console.error('Failed to add note', error);
      notify.error({
        key: 'sale-note-error',
        title: 'Failed to add note',
        description: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenConversation = useCallback(() => {
    if (!sale) return;
    const id = sale.conversationId || sale.providerId;
    if (!id) {
      notify.info({
        key: 'sales:conversation:missing',
        title: 'Conversation not linked',
        description: 'This sale is not connected to a conversation yet.',
      });
      return;
    }
    window.location.href = `/dashboard/inbox?conversation=${id}`;
  }, [sale]);

  const renderSkeleton = () => (
    <Card>
      <CardContent className='space-y-5 p-6'>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-24 w-full' />
      </CardContent>
    </Card>
  );

  const renderEmpty = () => (
    <Card>
      <CardHeader>
        <CardTitle>Sale not found</CardTitle>
        <CardDescription>This sale may have been removed or reassigned.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        <Button variant='default' onClick={() => navigate('/dashboard/sales')}>
          Return to Sales
        </Button>
        <Button variant='ghost' onClick={() => loadSale()}>
          Reload
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className='p-4 sm:p-6 space-y-6 max-w-5xl mx-auto'>
      <div className='flex flex-wrap items-center gap-3'>
        <Button variant='ghost' size='sm' onClick={() => navigate('/dashboard/sales')}>
          <ArrowLeft className='h-4 w-4 mr-1.5' />
          Back to Sales
        </Button>
        <div className='flex-1' />
        <Button variant='outline' size='sm' onClick={() => loadSale({ silent: true })} disabled={silentLoading || isLoading}>
          {silentLoading ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <RefreshCcw className='h-4 w-4 mr-2' />}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : !sale ? (
        renderEmpty()
      ) : (
        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            <Card>
              <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                  <div className='flex items-center gap-2 mb-2'>
                    <Badge variant='outline' className='uppercase text-[10px] tracking-wider'>
                      {sale.source}
                    </Badge>
                    {sale.updatedAt && (
                      <span className='text-xs text-muted-foreground'>
                        Updated {formatDistanceToNow(new Date(sale.updatedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <CardTitle className='text-2xl'>{sale.name}</CardTitle>
                  <CardDescription className='mt-1'>{sale.email || 'No email on record'}</CardDescription>
                </div>
                <Button onClick={handleOpenConversation}>
                  <MessageSquare className='h-4 w-4 mr-2' />
                  Open Chat
                </Button>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Status</Label>
                    <Select value={sale.stage} onValueChange={handleStatusChange} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_LABELS.map((label) => (
                          <SelectItem key={label} value={label}>
                            {leadLabelUtils.getDisplayName(label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Assigned Owner</Label>
                    <Select value={sale.assignedTo} onValueChange={handleAssigneeChange} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select owner' />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            <div className='flex items-center gap-2'>
                              <Avatar className='h-5 w-5'>
                                <AvatarImage src={member.user?.profileImage || undefined} />
                                <AvatarFallback className='text-[10px]'>
                                  {member.user?.firstName?.[0]}
                                  {member.user?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {member.user?.firstName} {member.user?.lastName}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='rounded-lg border p-4 bg-muted/30'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-medium'>Sale Value</p>
                    <Badge variant='secondary'>{sale.value ? `$${sale.value.toLocaleString()}` : 'Not set'}</Badge>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Value is currently tracked automatically from invoice generation. Manual value editing coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes & Activity</CardTitle>
                <CardDescription>Keep track of important details and updates.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-3'>
                  <Label>Add a note</Label>
                  <div className='flex gap-3'>
                    <Textarea
                      placeholder='Type your note here...'
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className='min-h-[80px]'
                    />
                  </div>
                  <div className='flex justify-end'>
                    <Button size='sm' onClick={handleAddNote} disabled={!newNote.trim() || isSaving}>
                      {isSaving ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <Send className='h-4 w-4 mr-2' />}
                      Save Note
                    </Button>
                  </div>
                </div>

                <div className='space-y-4 pt-4 border-t'>
                  <h4 className='text-sm font-medium text-muted-foreground'>History</h4>
                  {sale.noteHistory && sale.noteHistory.length > 0 ? (
                    <div className='space-y-4'>
                      {sale.noteHistory.map((note) => (
                        <div key={note.id} className='flex gap-3'>
                          <Avatar className='h-8 w-8 mt-1'>
                            <AvatarImage src={note.author?.profileImage || undefined} />
                            <AvatarFallback>
                              {note.author?.firstName?.[0]}
                              {note.author?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1 space-y-1'>
                            <div className='flex items-center justify-between'>
                              <p className='text-sm font-medium'>
                                {note.author?.firstName} {note.author?.lastName}
                              </p>
                              <span className='text-xs text-muted-foreground'>
                                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className='rounded-lg border p-3 bg-muted/30 text-sm'>
                              {note.note}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground text-center py-4'>No notes yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium'>Lead Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Created</p>
                  <p className='text-sm font-medium mt-1'>
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Last Activity</p>
                  <p className='text-sm font-medium mt-1'>
                    {sale.lastActivity ? new Date(sale.lastActivity).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Source</p>
                  <p className='text-sm font-medium mt-1 capitalize'>{sale.source}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Provider ID</p>
                  <p className='text-sm font-medium mt-1 font-mono text-xs truncate'>
                    {sale.providerId || sale.conversationId}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription className='mt-2 text-xs'>
                Use notes to track specific product details, delivery addresses, or special requests for this sale.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleDetailPage;
