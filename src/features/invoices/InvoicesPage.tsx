import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Plus, RefreshCw, ShieldCheck, FileText, Zap, MessageSquare, CreditCard, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

import { endpoints } from '@/api/config';
import client from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/toast';
import { useConfirm } from '@/ui/ux/confirm-dialog';

import { InvoiceCollection, InvoiceSummary, formatCurrency, parseItems, statusTone } from './invoiceTypes';

// Simple step component for better UX
const Step = ({
  icon: Icon,
  title,
  description,
  number,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  number: number;
}) => (
  <div className='flex gap-3 items-start'>
    <div className='flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
      <span className='text-sm font-semibold text-primary'>{number}</span>
    </div>
    <div className='space-y-1'>
      <div className='flex items-center gap-2'>
        <Icon className='h-4 w-4 text-primary' />
        <h3 className='font-medium text-sm'>{title}</h3>
      </div>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  </div>
);

const useInvoices = () =>
  useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await client.get(endpoints.invoices.list);
      const payload = response?.data?.data as InvoiceCollection | undefined;
      if (!payload) {
        throw new Error('Unable to fetch invoices');
      }
      const items = payload.items.map((item) => ({
        ...item,
        items: parseItems(item.items),
      }));
      return {
        items,
        summary: payload.summary,
      };
    },
    staleTime: 20_000,
  });

const InvoiceSummarySkeleton = () => (
  <div className='grid gap-4 sm:grid-cols-3'>
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index}>
        <CardHeader className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-6 w-28' />
        </CardHeader>
      </Card>
    ))}
  </div>
);

const InvoicesTableSkeleton = () => (
  <Card>
    <CardHeader className='flex flex-row items-center justify-between'>
      <CardTitle>Invoices</CardTitle>
      <Skeleton className='h-8 w-24' />
    </CardHeader>
    <CardContent>
      <div className='space-y-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,120px)_minmax(0,120px)] gap-3 rounded-lg border p-3 text-sm'
          >
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-24 justify-self-end' />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>No invoices yet</CardTitle>
    </CardHeader>
    <CardContent className='space-y-4 text-sm text-muted-foreground'>
      <p>Create your first invoice to start tracking payments and issuing receipts to your customers.</p>
      <div className='flex flex-wrap items-center gap-3'>
        <Button onClick={onCreate}>
          <Plus className='mr-2 h-4 w-4' />
          Create Invoice
        </Button>
        <Button asChild variant='link' className='px-0'>
          <a href='https://support.leadsbox.io/payments/invoices' target='_blank' rel='noopener noreferrer'>
            Learn how invoicing works
          </a>
        </Button>
      </div>
    </CardContent>
  </Card>
);

const InvoiceStatusBadge = ({ status }: { status: string }) => {
  const config = statusTone[status] || statusTone.DEFAULT;
  return <Badge className={cn('px-2 py-1 text-xs font-medium', config.badgeClass)}>{config.label}</Badge>;
};

const InvoiceSummaryCards = ({ data }: { data: InvoiceCollection | undefined }) => {
  if (!data) return null;
  const outstandingTotal = data.items.reduce((sum, invoice) => sum + invoice.outstanding, 0);
  const paidCount = data.summary.byStatus?.PAID ?? 0;
  const sentCount = data.summary.byStatus?.SENT ?? 0;

  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <Card>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>Outstanding Amount</CardTitle>
          <div className='text-2xl font-semibold text-foreground'>{formatCurrency(outstandingTotal, 'NGN')}</div>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <ShieldCheck className='h-3.5 w-3.5' />
            {data.summary.totalInvoices} invoices total
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>Paid Invoices</CardTitle>
          <div className='text-2xl font-semibold text-foreground'>{paidCount}</div>
          <div className='text-xs text-muted-foreground'>
            {formatCurrency(
              data.items.filter((invoice) => invoice.isPaid).reduce((sum, invoice) => sum + invoice.total, 0),
              'NGN'
            )}{' '}
            collected
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>Sent / Draft</CardTitle>
          <div className='text-2xl font-semibold text-foreground'>{sentCount}</div>
          <div className='text-xs text-muted-foreground'>Follow up on newly issued invoices to close faster.</div>
        </CardHeader>
      </Card>
    </div>
  );
};

const InvoicesTable = ({
  items,
  onView,
  onDelete,
  isRefreshing,
  onRefresh,
  deletingCode,
}: {
  items: InvoiceSummary[];
  onView: (invoice: InvoiceSummary) => void;
  onDelete: (invoice: InvoiceSummary) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  deletingCode: string | null;
}) => {
  return (
    <Card>
      <CardHeader className='flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <CardTitle className='text-lg font-semibold'>Invoices</CardTitle>
          <p className='text-sm text-muted-foreground'>Track issued invoices, outstanding balances, and receipts.</p>
        </div>
        <Button size='sm' variant='outline' onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className='relative'>
        <ScrollArea className='h-[420px]'>
          <div className='space-y-2'>
            {items.map((invoice) => {
              const statusConfig = statusTone[invoice.status] || statusTone.DEFAULT;
              return (
                <button
                  type='button'
                  key={invoice.id}
                  onClick={() => onView(invoice)}
                  className={cn(
                    'flex w-full flex-col rounded-lg border px-4 py-3 text-left transition hover:border-muted-foreground/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between'
                  )}
                >
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-foreground'>{invoice.code}</span>
                      <Badge className={cn('text-xs', statusConfig.badgeClass)}>{statusConfig.label}</Badge>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {invoice.contactPhone || 'No customer phone'} • {format(new Date(invoice.createdAt), 'PPp')}
                    </div>
                  </div>
                  <div className='flex items-center gap-4 pt-3 text-sm sm:pt-0'>
                    <div className='text-right'>
                      <div className='font-medium text-foreground'>{formatCurrency(invoice.total, invoice.currency)}</div>
                      <div className='text-xs text-muted-foreground'>Outstanding {formatCurrency(invoice.outstanding, invoice.currency)}</div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <ArrowRight className='hidden h-4 w-4 text-muted-foreground sm:block' />
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-destructive hover:text-destructive'
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onDelete(invoice);
                        }}
                        disabled={deletingCode === invoice.code}
                        aria-label={`Delete invoice ${invoice.code}`}
                      >
                        {deletingCode === invoice.code ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                      </Button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const invoicesQuery = useInvoices();
  const queryClient = useQueryClient();
  const openConfirm = useConfirm();

  const isLoading = invoicesQuery.isLoading;
  const hasInvoices = invoicesQuery.data?.items?.length;

  const handleViewInvoice = (invoice: InvoiceSummary) => {
    navigate(`/dashboard/invoices/${invoice.code}`);
  };

  const deleteMutation = useMutation<void, unknown, { code: string; total: number }>({
    mutationFn: async ({ code }) => {
      await client.delete(endpoints.invoices.remove(code));
    },
    onSuccess: (_, variables) => {
      notify.success({
        key: `invoice:${variables.code}:deleted`,
        title: 'Invoice deleted',
        description: `Invoice ${variables.code} has been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error, variables) => {
      let message = 'Failed to delete invoice.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message = String((error as { message?: string }).message || message);
      }
      notify.error({
        key: `invoice:${variables.code}:delete:error`,
        title: 'Unable to delete invoice',
        description: message,
      });
    },
  });

  const handleDeleteInvoice = async (invoice: InvoiceSummary) => {
    try {
      const confirmed = await openConfirm({
        title: 'Delete this invoice?',
        description: `Invoice ${invoice.code} and its receipts will be removed permanently.`,
        confirmText: 'Delete invoice',
        cancelText: 'Cancel',
        variant: 'destructive',
      });
      if (!confirmed) return;
      deleteMutation.mutate({ code: invoice.code, total: invoice.total });
    } catch (error) {
      console.error('Error confirming invoice deletion:', error);
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Invoices & Receipts</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>
            Create professional invoices, track payments, and issue receipts in 3 simple steps.
          </p>
        </div>
        <Button className='w-full sm:w-auto' onClick={() => navigate('/dashboard/invoices/new')}>
          <Plus className='h-4 w-4 mr-2' />
          Create Invoice
        </Button>
      </div>

      {isLoading ? (
        <>
          <InvoiceSummarySkeleton />
          <InvoicesTableSkeleton />
        </>
      ) : hasInvoices ? (
        <>
          <InvoiceSummaryCards data={invoicesQuery.data} />
          <InvoicesTable
            items={invoicesQuery.data!.items}
            onView={handleViewInvoice}
             onDelete={handleDeleteInvoice}
            isRefreshing={invoicesQuery.isRefetching}
            onRefresh={() => invoicesQuery.refetch()}
            deletingCode={deleteMutation.isPending ? deleteMutation.variables?.code ?? null : null}
          />
        </>
      ) : (
        <div className='space-y-6'>
          {/* How it Works - Step by Step */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='h-5 w-5 text-primary' />
                How it works
              </CardTitle>
              <CardDescription>Professional invoice creation and payment tracking in 3 simple steps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 md:grid-cols-3'>
                <Step number={1} icon={FileText} title='Create invoice' description='Add line items, set prices, and include customer details' />
                <Step number={2} icon={MessageSquare} title='Send via WhatsApp' description='Share payment link directly with your customers' />
                <Step number={3} icon={CreditCard} title='Track & get paid' description='Monitor payments and issue receipts automatically' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium text-foreground mb-2'>No invoices found</h3>
                <p className='text-muted-foreground mb-4'>
                  Create your first invoice to start tracking payments and issuing receipts to your customers.
                </p>
                <Button onClick={() => navigate('/dashboard/invoices/new')}>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Your First Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
