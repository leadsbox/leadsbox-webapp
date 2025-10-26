import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  RefreshCcw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const { getMemberByUserId } = useOrgMembers();

  const [sale, setSale] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);

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

  const assignedMember = useMemo(() => {
    if (!sale?.assignedTo) return null;
    const member = getMemberByUserId(sale.assignedTo);
    if (!member) return null;
    const { user } = member;
    const fullName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ');
    const name = fullName || user?.username || user?.email || 'Team member';
    return {
      name,
      avatar: user?.profileImage ?? null,
    };
  }, [getMemberByUserId, sale?.assignedTo]);

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
    <div className='p-4 sm:p-6 space-y-4'>
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
        <>
          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <CardTitle className='text-2xl'>{sale.name}</CardTitle>
                <CardDescription>{sale.email || 'No email on record'}</CardDescription>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary' className='text-sm'>
                  {leadLabelUtils.getDisplayName(sale.stage)}
                </Badge>
                <Button variant='outline' size='sm' onClick={handleOpenConversation}>
                  <MessageSquare className='h-4 w-4 mr-1.5' />
                  Open chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                <div className='rounded-lg border p-3'>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Channel</p>
                  <p className='text-sm font-medium capitalize mt-1'>{sale.source}</p>
                </div>
                <div className='rounded-lg border p-3'>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Last activity</p>
                  <p className='text-sm font-medium mt-1'>
                    {sale.updatedAt
                      ? formatDistanceToNow(new Date(sale.updatedAt), { addSuffix: true })
                      : 'Unknown'}
                  </p>
                </div>
                <div className='rounded-lg border p-3'>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Value recorded</p>
                  <p className='text-sm font-medium mt-1'>
                    {sale.value ? `$${sale.value.toLocaleString()}` : 'Not captured'}
                  </p>
                </div>
                <div className='rounded-lg border p-3 flex items-center gap-3 sm:col-span-2 lg:col-span-1'>
                  {assignedMember ? (
                    <>
                      <Avatar className='h-9 w-9'>
                        {assignedMember.avatar ? (
                          <AvatarImage src={assignedMember.avatar} alt={assignedMember.name} />
                        ) : (
                          <AvatarFallback>
                            {assignedMember.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className='text-xs text-muted-foreground uppercase tracking-wide'>Owner</p>
                        <p className='text-sm font-medium'>{assignedMember.name}</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className='text-xs text-muted-foreground uppercase tracking-wide'>Owner</p>
                      <p className='text-sm font-medium'>Unassigned</p>
                    </div>
                  )}
                </div>
                <div className='rounded-lg border p-3 sm:col-span-2 lg:col-span-3'>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Created</p>
                  <p className='text-sm font-medium mt-1'>
                    {sale.createdAt
                      ? new Date(sale.createdAt).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              <Alert>
                <AlertTitle>Manual sale details</AlertTitle>
                <AlertDescription>
                  We don’t auto-detect the sale description, quantity, or amount from the chat.
                  Add the specifics to your notes or invoices to keep everyone aligned.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
              <CardDescription>Summaries you captured directly from the conversation.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {sale.notes ? (
                <p className='rounded-md border border-border bg-muted/60 p-4 text-sm'>{sale.notes}</p>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No note added yet. Head back to the conversation to jot down what was purchased, for how much, and any delivery details.
                </p>
              )}

              {sale.noteHistory && sale.noteHistory.length > 0 ? (
                <div className='space-y-2'>
                  <Label>Recent history</Label>
                  <div className='space-y-3 max-h-60 overflow-y-auto pr-1'>
                    {sale.noteHistory.map((note) => (
                      <div key={note.id} className='rounded-lg border p-3 text-sm'>
                        <p className='text-muted-foreground text-xs mb-1'>
                          {formatDistanceToNow(new Date(note.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                        <p>{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SaleDetailPage;
