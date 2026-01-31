import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Check, DollarSign, Loader2, MessageSquare, Pencil, Plus, RefreshCcw, Save, Send, Trash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Lead, LeadLabel, leadLabelUtils } from '@/types';
import { notify } from '@/lib/toast';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { invoiceApi, Invoice } from '@/api/invoices';
import { salesApi, Sale, SaleItem } from '@/api/sales';
import { AddManualSaleModal } from './AddManualSaleModal';
import { ImportCSVModal } from './ImportCSVModal';

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
    name: payload.providerId ? `Lead ${String(payload.providerId).slice(0, 6)}` : payload.conversationId || 'Lead',
    email: payload.user?.email || '',
    phone: undefined,
    company: undefined,
    source: (String(payload.provider || 'manual').toLowerCase() as Lead['source']) || 'manual',
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Sales records state
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [showImportCSVModal, setShowImportCSVModal] = useState(false);

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
        const payload: BackendLead | undefined = response?.data?.data?.lead || response?.data?.lead || response?.data;
        if (!payload) {
          throw new Error('Sale not found');
        }
        setSale(mapBackendLead(payload));

        // Fetch invoices for this sale/lead
        try {
          const invResponse = await invoiceApi.list({ leadId: saleId });
          setInvoices(invResponse.data.invoices || []);
        } catch (invError) {
          console.error('Failed to load invoices for sale', invError);
        }
      } catch (error) {
        // ...
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
    [saleId],
  );

  // Fetch sales records for this lead
  const fetchSales = useCallback(async () => {
    if (!saleId) return;
    try {
      setSalesLoading(true);
      const response = await salesApi.list({ leadId: saleId });
      setSales(response?.data?.sales || []);
    } catch (error) {
      console.error('Failed to load sales for lead:', error);
      setSales([]);
    } finally {
      setSalesLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    loadSale();
    fetchSales();
  }, [loadSale, fetchSales]);

  const prevStage = React.useRef<string | undefined>(undefined);
  const [highlightStage, setHighlightStage] = React.useState(false);

  useEffect(() => {
    // Only animate if we had a previous stage (not initial load) and it changed
    if (sale?.stage && prevStage.current && sale.stage !== prevStage.current) {
      setHighlightStage(true);
      const timer = setTimeout(() => setHighlightStage(false), 2500); // 2.5s highlight
      return () => clearTimeout(timer);
    }
    // Update ref
    if (sale?.stage) {
      prevStage.current = sale.stage;
    }
  }, [sale?.stage]);

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
    console.log('handleAssigneeChange', { saleId: sale.id, userId });
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
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={() => navigate(`/dashboard/invoices/create?leadId=${sale.id}`)}>
                    <Plus className='h-4 w-4 mr-2' />
                    Record Sale
                  </Button>
                  <Button onClick={handleOpenConversation}>
                    <MessageSquare className='h-4 w-4 mr-2' />
                    Open Chat
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Status</Label>
                    <Select value={sale.stage} onValueChange={handleStatusChange} disabled={isSaving}>
                      <SelectTrigger
                        className={`transition-all duration-500 ${highlightStage ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-50 dark:bg-purple-900/20' : ''}`}
                      >
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

            {/* AI Detected Drafts */}
            {invoices.filter((inv) => ['DRAFT', 'PENDING_CONFIRMATION'].includes(inv.status)).length > 0 && (
              <Card className='border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-900/10'>
                <CardHeader>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-purple-500 animate-pulse' />
                    <CardTitle className='text-purple-900 dark:text-purple-100'>AI Detected Sales</CardTitle>
                  </div>
                  <CardDescription>Potential sales detected from conversation. Review to confirm.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {invoices
                    .filter((inv) => ['DRAFT', 'PENDING_CONFIRMATION'].includes(inv.status))
                    .map((invoice) => (
                      <div key={invoice.id} className='space-y-4 bg-background p-4 rounded-lg border shadow-sm'>
                        <div className='flex items-center justify-between pb-2 border-b'>
                          <div className='flex flex-col'>
                            <span className='font-medium text-sm'>Draft #{invoice.code}</span>
                            <span className='text-xs text-muted-foreground'>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline' className='bg-purple-100 text-purple-700 border-purple-200'>
                              {invoice.status === 'PENDING_CONFIRMATION' ? 'Ready to Confirm' : 'Draft'}
                            </Badge>
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className='rounded-md border'>
                          <table className='w-full text-sm'>
                            <thead className='bg-muted/50'>
                              <tr className='border-b'>
                                <th className='h-10 px-4 text-left font-medium text-muted-foreground w-1/2'>Item</th>
                                <th className='h-10 px-4 text-right font-medium text-muted-foreground'>Qty</th>
                                <th className='h-10 px-4 text-right font-medium text-muted-foreground'>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items && invoice.items.length > 0 ? (
                                invoice.items.map((item, idx) => (
                                  <tr key={idx} className='border-b last:border-0 hover:bg-muted/50'>
                                    <td className='p-3 align-middle font-medium'>{item.name}</td>
                                    <td className='p-3 align-middle text-right'>{item.qty}</td>
                                    <td className='p-3 align-middle text-right'>
                                      {invoice.currency} {item.unitPrice.toLocaleString()}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className='p-4 text-center text-muted-foreground'>
                                    No items
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className='bg-muted/50 font-medium'>
                              <tr>
                                <td colSpan={2} className='px-4 py-2 text-right text-xs uppercase text-muted-foreground'>
                                  Total Value
                                </td>
                                <td className='px-4 py-2 text-right'>
                                  {invoice.currency} {invoice.total.toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Actions */}
                        <div className='flex gap-2 justify-end pt-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive hover:bg-destructive/10'
                            onClick={() => {
                              if (confirm('Are you sure you want to discard this draft?')) {
                                invoiceApi
                                  .delete(invoice.code)
                                  .then(() => {
                                    notify.success({ title: 'Draft discarded' });
                                    loadSale({ silent: true });
                                  })
                                  .catch(() => notify.error({ title: 'Failed to delete' }));
                              }
                            }}
                          >
                            <Trash className='h-4 w-4 mr-2' />
                            Discard
                          </Button>
                          <Button variant='outline' size='sm' onClick={() => navigate(`/dashboard/invoices/create?code=${invoice.code}&edit=true`)}>
                            <Pencil className='h-4 w-4 mr-2' />
                            Edit Details
                          </Button>
                          <Button
                            size='sm'
                            className='bg-purple-600 hover:bg-purple-700 text-white'
                            onClick={() => {
                              invoiceApi
                                .update(invoice.code, { status: 'SENT' })
                                .then(() => {
                                  notify.success({ title: 'Sale Confirmed', description: 'Invoice has been generated.' });
                                  loadSale({ silent: true });
                                })
                                .catch(() => notify.error({ title: 'Failed to confirm' }));
                            }}
                          >
                            <Check className='h-4 w-4 mr-2' />
                            Confirm Sale
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Sales History - Manual, Imported & AI-Detected Sales */}
            {(salesLoading || sales.length > 0) && (
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <DollarSign className='h-5 w-5' />
                      <CardTitle>Sales History</CardTitle>
                    </div>
                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm' onClick={() => setShowImportCSVModal(true)}>
                        Import CSV
                      </Button>
                      <Button size='sm' onClick={() => setShowAddSaleModal(true)}>
                        <Plus className='h-4 w-4 mr-2' />
                        Add Sale
                      </Button>
                    </div>
                  </div>
                  <CardDescription>All sales transactions from conversations and manual entries</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <div className='space-y-3'>
                      <Skeleton className='h-32 w-full' />
                      <Skeleton className='h-32 w-full' />
                    </div>
                  ) : sales.length > 0 ? (
                    <div className='space-y-4'>
                      {sales.map((saleRecord) => {
                        const totalItems = (saleRecord.items as SaleItem[])?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                        const statusColor =
                          saleRecord.status === 'PAID'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : saleRecord.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-gray-500/10 text-gray-600 border-gray-500/20';

                        return (
                          <div key={saleRecord.id} className='p-4 border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors'>
                            {/* Sale Header */}
                            <div className='flex items-start justify-between mb-3'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                  <span className='font-bold text-xl'>
                                    {saleRecord.currency} {saleRecord.amount.toLocaleString()}
                                  </span>
                                  <Badge className={statusColor}>{saleRecord.status}</Badge>
                                  {saleRecord.isAutoDetected && (
                                    <Badge
                                      variant='outline'
                                      className='text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                    >
                                      🤖 AI-Detected
                                    </Badge>
                                  )}
                                  {saleRecord.isManual && (
                                    <Badge variant='outline' className='text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'>
                                      ✍️ Manual
                                    </Badge>
                                  )}
                                  {saleRecord.isImported && (
                                    <Badge variant='outline' className='text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'>
                                      📥 Imported
                                    </Badge>
                                  )}
                                </div>
                                <p className='text-xs text-muted-foreground'>
                                  {new Date(saleRecord.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  // TODO: Open edit modal
                                  console.log('Edit sale:', saleRecord.id);
                                }}
                              >
                                <Pencil className='h-4 w-4' />
                              </Button>
                            </div>

                            {/* Items List */}
                            <div className='space-y-2 mt-3 pt-3 border-t'>
                              <p className='text-sm font-medium text-muted-foreground mb-2'>Items:</p>
                              {(saleRecord.items as SaleItem[]).map((item, idx) => (
                                <div key={idx} className='flex items-center justify-between text-sm bg-background p-2 rounded'>
                                  <div className='flex-1'>
                                    <span className='font-medium'>{item.name}</span>
                                    <span className='text-muted-foreground ml-2'>× {item.quantity}</span>
                                  </div>
                                  <span className='font-medium'>
                                    {saleRecord.currency} {(item.unitPrice * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              ))}

                              {/* Total Summary */}
                              <div className='flex items-center justify-between text-sm font-semibold pt-2 border-t'>
                                <span>
                                  Total ({totalItems} item{totalItems !== 1 ? 's' : ''})
                                </span>
                                <span>
                                  {saleRecord.currency} {saleRecord.amount.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* AI Detection Info */}
                            {saleRecord.isAutoDetected && saleRecord.detectionReasoning && (
                              <div className='mt-3 pt-3 border-t'>
                                <p className='text-xs font-medium text-muted-foreground mb-1'>AI Detection Reasoning:</p>
                                <p className='text-xs text-muted-foreground italic'>{saleRecord.detectionReasoning}</p>
                                {saleRecord.detectionConfidence && (
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    Confidence: {(saleRecord.detectionConfidence * 100).toFixed(0)}%
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='text-center py-12 text-muted-foreground'>
                      <DollarSign className='h-16 w-16 mx-auto mb-4 opacity-20' />
                      <h3 className='text-lg font-semibold mb-2'>No Sales Yet</h3>
                      <p className='text-sm mb-4'>AI-detected sales, manual entries, and imported records will appear here</p>
                      <div className='flex gap-2 justify-center'>
                        <Button variant='outline' size='sm'>
                          Import from CSV
                        </Button>
                        <Button size='sm'>
                          <Plus className='h-4 w-4 mr-2' />
                          Add Manual Sale
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Confirmed Orders (Invoices) */}
            {invoices.filter((inv) => !['DRAFT', 'PENDING_CONFIRMATION'].includes(inv.status)).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Confirmed Orders</CardTitle>
                  <CardDescription>Processed sales and invoices</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {invoices
                    .filter((inv) => !['DRAFT', 'PENDING_CONFIRMATION'].includes(inv.status))
                    .map((invoice) => (
                      <div key={invoice.id} className='space-y-4'>
                        <div className='flex items-center justify-between pb-2 border-b'>
                          <div className='flex flex-col'>
                            <span className='font-medium text-sm'>Invoice #{invoice.code}</span>
                            <span className='text-xs text-muted-foreground'>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                          </div>
                          <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'}>{invoice.status}</Badge>
                        </div>

                        {/* Items Table */}
                        <div className='rounded-md border'>
                          <table className='w-full text-sm'>
                            <thead className='bg-muted/50'>
                              <tr className='border-b'>
                                <th className='h-10 px-4 text-left font-medium text-muted-foreground'>Item</th>
                                <th className='h-10 px-4 text-right font-medium text-muted-foreground'>Qty</th>
                                <th className='h-10 px-4 text-right font-medium text-muted-foreground'>Price</th>
                                <th className='h-10 px-4 text-right font-medium text-muted-foreground'>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items && invoice.items.length > 0 ? (
                                invoice.items.map((item, idx) => (
                                  <tr key={idx} className='border-b last:border-0 hover:bg-muted/50'>
                                    <td className='p-4 align-middle font-medium'>{item.name}</td>
                                    <td className='p-4 align-middle text-right'>{item.qty}</td>
                                    <td className='p-4 align-middle text-right'>
                                      {invoice.currency} {item.unitPrice.toLocaleString()}
                                    </td>
                                    <td className='p-4 align-middle text-right'>
                                      {invoice.currency} {(item.qty * item.unitPrice).toLocaleString()}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className='p-4 text-center text-muted-foreground'>
                                    No items listed
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className='bg-muted/50 font-medium'>
                              <tr>
                                <td colSpan={3} className='px-4 py-3 text-right'>
                                  Subtotal
                                </td>
                                <td className='px-4 py-3 text-right'>
                                  {invoice.currency} {invoice.subtotal.toLocaleString()}
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={3} className='px-4 py-3 text-right'>
                                  Total
                                </td>
                                <td className='px-4 py-3 text-right'>
                                  {invoice.currency} {invoice.total.toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        <div className='flex justify-end'>
                          <Button variant='ghost' size='sm' onClick={() => navigate(`/dashboard/invoices/create?code=${invoice.code}&edit=true`)}>
                            <Pencil className='h-3 w-3 mr-2' />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

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
                            <div className='rounded-lg border p-3 bg-muted/30 text-sm'>{note.note}</div>
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
                  <p className='text-sm font-medium mt-1'>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'Unknown'}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Last Activity</p>
                  <p className='text-sm font-medium mt-1'>{sale.lastActivity ? new Date(sale.lastActivity).toLocaleString() : 'Unknown'}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Source</p>
                  <p className='text-sm font-medium mt-1 capitalize'>{sale.source}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>Provider ID</p>
                  <p className='text-sm font-medium mt-1 font-mono text-xs truncate'>{sale.providerId || sale.conversationId}</p>
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

      {/* Modals */}
      <AddManualSaleModal
        open={showAddSaleModal}
        onOpenChange={setShowAddSaleModal}
        leadId={saleId || ''}
        onSuccess={() => {
          fetchSales();
          loadSale({ silent: true });
        }}
      />
      <ImportCSVModal
        open={showImportCSVModal}
        onOpenChange={setShowImportCSVModal}
        leadId={saleId || ''}
        onSuccess={() => {
          fetchSales();
          loadSale({ silent: true });
        }}
      />
    </div>
  );
};

export default SaleDetailPage;
