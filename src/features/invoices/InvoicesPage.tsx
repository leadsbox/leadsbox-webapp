import React, { useEffect, useMemo, useState } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
    <CardContent className='p-0'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[40px]'>
              <Skeleton className='h-4 w-4 rounded' />
            </TableHead>
            <TableHead className='w-[24%]'>Invoice</TableHead>
            <TableHead className='w-[16%]'>Status</TableHead>
            <TableHead className='w-[18%]'>Outstanding</TableHead>
            <TableHead className='hidden lg:table-cell w-[18%]'>Created</TableHead>
            <TableHead className='w-[160px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className='h-4 w-4 rounded' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='mt-2 h-3 w-48' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-20' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-24' />
              </TableCell>
              <TableCell className='hidden lg:table-cell'>
                <Skeleton className='h-4 w-24' />
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-8 w-24' />
                  <Skeleton className='h-8 w-12' />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
  onBulkDelete,
  selectedCount,
  isRefreshing,
  onRefresh,
  deletingCode,
  selectedCodes,
  toggleSelection,
  toggleAll,
  allSelected,
  bulkDeleting,
}: {
  items: InvoiceSummary[];
  onView: (invoice: InvoiceSummary) => void;
  onDelete: (invoice: InvoiceSummary) => void;
  onBulkDelete: () => void;
  selectedCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  deletingCode: string | null;
  selectedCodes: Set<string>;
  toggleSelection: (code: string, checked?: boolean | string) => void;
  toggleAll: (checked?: boolean | string) => void;
  allSelected: boolean;
  bulkDeleting: boolean;
}) => {
  return (
    <Card>
      <CardHeader className='flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <CardTitle className='text-lg font-semibold'>Invoices</CardTitle>
          <p className='text-sm text-muted-foreground'>Track issued invoices, outstanding balances, and receipts.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {selectedCount > 0 ? (
            <Button
              variant='default'
              size='sm'
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onBulkDelete();
              }}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
              Delete selected ({selectedCount})
            </Button>
          ) : null}
          <Button size='sm' variant='outline' onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <ScrollArea className='h-[420px]'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[40px]'>
                  <Checkbox
                    checked={
                      items.length === 0
                        ? false
                        : allSelected
                        ? true
                        : selectedCount > 0
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={(checked) => toggleAll(checked === true ? true : checked === false ? false : undefined)}
                    aria-label='Select all invoices'
                  />
                </TableHead>
                <TableHead className='w-[24%]'>Invoice</TableHead>
                <TableHead className='w-[16%]'>Status</TableHead>
                <TableHead className='w-[18%]'>Outstanding</TableHead>
                <TableHead className='hidden lg:table-cell w-[18%]'>Created</TableHead>
                <TableHead className='w-[160px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((invoice) => {
                const statusConfig = statusTone[invoice.status] || statusTone.DEFAULT;
                const isSelected = selectedCodes.has(invoice.code);
                return (
                  <TableRow
                    key={invoice.id}
                    className={cn(
                      'group cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isSelected ? 'bg-primary/5' : undefined
                    )}
                    tabIndex={0}
                    onClick={() => onView(invoice)}
                    onKeyDown={(event) => {
                      if (event.target instanceof HTMLInputElement) {
                        return;
                      }
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onView(invoice);
                      }
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleSelection(invoice.code, checked === true)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Select invoice ${invoice.code}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <span className='text-sm font-semibold text-foreground'>{invoice.code}</span>
                        <div className='text-xs text-muted-foreground'>
                          {invoice.contactPhone || 'No customer phone'} • {format(new Date(invoice.createdAt), 'PPp')}
                        </div>
                        <div className='text-xs text-muted-foreground'>Total {formatCurrency(invoice.total, invoice.currency)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusConfig.badgeClass)}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.outstanding, invoice.currency)}</TableCell>
                    <TableCell className='hidden lg:table-cell text-sm text-muted-foreground'>{format(new Date(invoice.createdAt), 'PP')}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2 whitespace-nowrap'>
                        <Button
                          variant='default'
                          size='sm'
                          disabled={deletingCode === invoice.code || bulkDeleting}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onDelete(invoice);
                          }}
                          type='button'
                        >
                          {deletingCode === invoice.code ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
                          Delete
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onView(invoice);
                          }}
                        >
                          <ArrowRight className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-8 text-center text-sm text-muted-foreground'>
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
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

  const [selectedInvoiceCodes, setSelectedInvoiceCodes] = useState<Set<string>>(new Set());

  const invoices = useMemo(() => invoicesQuery.data?.items ?? [], [invoicesQuery.data?.items]);

  useEffect(() => {
    setSelectedInvoiceCodes((prev) => {
      const next = new Set<string>();
      invoices.forEach((invoice) => {
        if (prev.has(invoice.code)) {
          next.add(invoice.code);
        }
      });
      return next;
    });
  }, [invoices]);

  const selectedInvoiceCount = selectedInvoiceCodes.size;
  const allInvoicesSelected = invoices.length > 0 && invoices.every((invoice) => selectedInvoiceCodes.has(invoice.code));

  const toggleInvoiceSelection = (code: string, checked?: boolean | string) => {
    setSelectedInvoiceCodes((prev) => {
      const next = new Set(prev);
      const shouldSelect = typeof checked === 'boolean' ? checked : checked === 'indeterminate' ? !next.has(code) : !next.has(code);
      if (shouldSelect) {
        next.add(code);
      } else {
        next.delete(code);
      }
      return next;
    });
  };

  const toggleAllInvoices = (checked?: boolean | string) => {
    setSelectedInvoiceCodes((prev) => {
      if (checked === false) {
        return new Set();
      }
      if (checked === true) {
        return new Set(invoices.map((invoice) => invoice.code));
      }
      const shouldClear = invoices.length > 0 && invoices.every((invoice) => prev.has(invoice.code));
      if (shouldClear) {
        return new Set();
      }
      return new Set(invoices.map((invoice) => invoice.code));
    });
  };

  const isLoading = invoicesQuery.isLoading;
  const hasInvoices = invoices.length > 0;

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
      setSelectedInvoiceCodes((prev) => {
        const next = new Set(prev);
        next.delete(variables.code);
        return next;
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

  const bulkDeleteMutation = useMutation<void, unknown, string[]>({
    mutationFn: async (codes) => {
      await client.post(endpoints.invoices.bulkRemove, { codes });
    },
    onSuccess: (_, codes) => {
      notify.success({
        key: `invoices:bulk-delete:${codes.length}`,
        title: 'Invoices deleted',
        description: `${codes.length} invoice${codes.length === 1 ? '' : 's'} removed.`,
      });
      setSelectedInvoiceCodes(new Set());
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      let message = 'Failed to delete invoices.';
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
        key: 'invoices:bulk-delete:error',
        title: 'Unable to delete invoices',
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

  const handleBulkDeleteInvoices = async () => {
    if (!selectedInvoiceCodes.size || bulkDeleteMutation.isPending) return;
    try {
      const confirmed = await openConfirm({
        title: 'Delete selected invoices?',
        description: `This will remove ${selectedInvoiceCodes.size} invoice${selectedInvoiceCodes.size === 1 ? '' : 's'} and related records.`,
        confirmText: 'Delete invoices',
        cancelText: 'Cancel',
        variant: 'destructive',
      });
      if (!confirmed) return;
      bulkDeleteMutation.mutate(Array.from(selectedInvoiceCodes));
    } catch (error) {
      console.error('Error confirming invoice bulk delete:', error);
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
            items={invoices}
            onView={handleViewInvoice}
            onDelete={handleDeleteInvoice}
            onBulkDelete={handleBulkDeleteInvoices}
            selectedCount={selectedInvoiceCount}
            isRefreshing={invoicesQuery.isRefetching}
            onRefresh={() => invoicesQuery.refetch()}
            deletingCode={deleteMutation.isPending ? deleteMutation.variables?.code ?? null : null}
            selectedCodes={selectedInvoiceCodes}
            toggleSelection={toggleInvoiceSelection}
            toggleAll={toggleAllInvoices}
            allSelected={allInvoicesSelected}
            bulkDeleting={bulkDeleteMutation.isPending}
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
