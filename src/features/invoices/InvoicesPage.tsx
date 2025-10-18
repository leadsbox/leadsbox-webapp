import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ClipboardCopy,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  ShieldCheck,
  FileText,
  CreditCard,
  Clock,
  Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { endpoints } from '@/api/config';
import client from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { confirm, useConfirm } from '@/ui/ux/confirm-dialog';

// Step component for the how-it-works section
const Step = ({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className='text-center space-y-3'>
    <div className='mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative'>
      <Icon className='h-5 w-5 text-primary' />
      <span className='absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center'>
        {number}
      </span>
    </div>
    <div className='space-y-1'>
      <h3 className='font-medium'>{title}</h3>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  </div>
);

type InvoiceItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

type InvoiceSummary = {
  id: string;
  code: string;
  status: string;
  contactPhone?: string | null;
  currency: string;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  totalPaid: number;
  outstanding: number;
  isPaid: boolean;
  receiptCount: number;
  lastReceiptAt: string | null;
  items: InvoiceItem[];
};

type InvoiceCollection = {
  items: InvoiceSummary[];
  summary: {
    totalInvoices: number;
    totalAmount: number;
    totalSubtotal: number;
    byStatus: Record<string, number>;
  };
};

type InvoiceDetailResponse = {
  invoice: InvoiceSummary & {
    organization?: { name?: string | null };
    receipts?: Array<{
      id: string;
      receiptNumber: string;
      createdAt: string;
      amount: number;
      status?: string | null;
    }>;
  };
  bank: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  } | null;
  html?: string;
};

type ReceiptInfo = {
  id: string;
  number: string;
  url: string;
  apiUrl?: string;
};

type ItemError = Partial<Record<keyof InvoiceItem, string>>;

const statusTone: Record<string, { label: string; badgeClass: string }> = {
  PAID: {
    label: 'Paid',
    badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  SENT: {
    label: 'Sent',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  },
  PARTIAL: {
    label: 'Partial',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  },
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-200',
  },
  DEFAULT: {
    label: 'Unknown',
    badgeClass: 'bg-muted text-muted-foreground',
  },
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch {
    return `${currency || 'NGN'} ${amount?.toFixed(2) ?? '0.00'}`;
  }
};

const parseItems = (items?: unknown): InvoiceItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      name: typeof (item as InvoiceItem)?.name === 'string' ? (item as InvoiceItem).name : '',
      qty: Number((item as InvoiceItem)?.qty) || 0,
      unitPrice: Number((item as InvoiceItem)?.unitPrice) || 0,
    }))
    .filter((item) => item.name && item.qty > 0);
};

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

const useInvoiceDetail = (code?: string) =>
  useQuery({
    queryKey: ['invoice-detail', code],
    enabled: Boolean(code),
    queryFn: async () => {
      if (!code) return undefined;
      const response = await client.get(endpoints.invoices.detail(code));
      const payload = response?.data?.data as InvoiceDetailResponse | undefined;
      if (!payload) return undefined;
      return {
        ...payload,
        invoice: {
          ...payload.invoice,
          items: parseItems(payload.invoice.items),
        },
      };
    },
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

const ItemsTable = ({ items }: { items: InvoiceItem[] }) => {
  if (!items.length) {
    return <div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>No line items were added to this invoice.</div>;
  }

  return (
    <div className='overflow-hidden rounded-md border'>
      <div className='grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] bg-muted/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        <span>Description</span>
        <span className='text-right'>Quantity</span>
        <span className='text-right'>Unit Price</span>
      </div>
      <div className='divide-y'>
        {items.map((item, index) => (
          <div key={index} className='grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] px-4 py-2 text-sm'>
            <span className='font-medium text-foreground'>{item.name}</span>
            <span className='text-right text-muted-foreground'>{item.qty}</span>
            <span className='text-right text-muted-foreground'>{formatCurrency(item.unitPrice, 'NGN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReceiptsList = ({
  receipts,
}: {
  receipts?: Array<{
    id: string;
    receiptNumber: string;
    createdAt: string;
    amount: number;
    status?: string | null;
  }>;
}) => {
  if (!receipts || receipts.length === 0) {
    return <p className='text-sm text-muted-foreground'>No receipts have been issued yet.</p>;
  }

  return (
    <div className='space-y-2'>
      {receipts.map((receipt) => (
        <div key={receipt.id} className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
          <div className='space-y-1'>
            <div className='font-medium text-foreground'>{receipt.receiptNumber}</div>
            <div className='text-xs text-muted-foreground'>
              {formatCurrency(receipt.amount, 'NGN')} • {format(new Date(receipt.createdAt), 'PPp')}
            </div>
          </div>
          <Button size='sm' variant='outline' asChild>
            <a href={`/dashboard/receipts/${receipt.id}`}>View</a>
          </Button>
        </div>
      ))}
    </div>
  );
};

const InvoiceDetail = ({ code }: { code: string | null }) => {
  const detailQuery = useInvoiceDetail(code || undefined);
  const { data, isLoading, isError } = detailQuery;

  if (!code) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an invoice</CardTitle>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground'>Choose an invoice to view line items, receipts, and payment details.</CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-64' />
          <Skeleton className='h-48 w-full' />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Unable to load invoice</AlertTitle>
            <AlertDescription>Try refreshing the page or selecting another invoice.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { invoice, bank, html } = data;
  const statusBadge = statusTone[invoice.status] || statusTone.DEFAULT;

  return (
    <Card className='space-y-4'>
      <CardHeader className='flex flex-col gap-2 space-y-0 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <CardTitle className='text-xl font-semibold text-foreground'>Invoice {invoice.code}</CardTitle>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span>Created {formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true })}</span>
            <span aria-hidden>•</span>
            <span>Total {formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
        <Badge className={cn('px-3 py-1 text-sm', statusBadge.badgeClass)}>{statusBadge.label}</Badge>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <h3 className='text-sm font-medium text-muted-foreground'>Line items</h3>
          <ItemsTable items={parseItems(invoice.items)} />
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='space-y-3 rounded-md border bg-muted/30 p-4 text-sm'>
            <div className='font-medium text-muted-foreground'>Payment summary</div>
            <div className='space-y-1'>
              <div className='flex items-center justify-between text-sm'>
                <span>Amount due</span>
                <span className='font-medium text-foreground'>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>Collected</span>
                <span>{formatCurrency(invoice.totalPaid, invoice.currency)}</span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span>Outstanding</span>
                <span
                  className={cn(
                    'font-semibold',
                    invoice.outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {formatCurrency(invoice.outstanding, invoice.currency)}
                </span>
              </div>
              {bank ? (
                <div className='mt-3 rounded-md bg-background/80 p-3 text-xs text-muted-foreground'>
                  <div className='font-medium text-foreground'>Payment instructions</div>
                  <div>{bank.accountName}</div>
                  <div>{bank.bankName}</div>
                  <div>{bank.accountNumber}</div>
                </div>
              ) : null}
            </div>
          </div>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-muted-foreground'>Receipts</h3>
              {invoice.receiptCount > 0 ? <Badge variant='outline'>{invoice.receiptCount} issued</Badge> : null}
            </div>
            <ReceiptsList receipts={invoice.receipts} />
          </div>
        </div>

        {html ? (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <Receipt className='h-4 w-4' />
              Invoice preview
            </div>
            <div className='rounded-md border'>
              <iframe title={`Invoice ${invoice.code}`} className='h-[480px] w-full rounded-md bg-background' srcDoc={html} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

const InvoiceForm = ({ onSubmitted }: { onSubmitted: (invoiceCode: string) => void }) => {
  const confirmDialog = useConfirm();
  const queryClient = useQueryClient();
  const [contactPhone, setContactPhone] = React.useState('');
  const [currency, setCurrency] = React.useState('NGN');
  const [items, setItems] = React.useState<InvoiceItem[]>([{ name: '', qty: 1, unitPrice: 0 }]);
  const [itemErrors, setItemErrors] = React.useState<ItemError[]>([{}]);
  const [formError, setFormError] = React.useState<string>('');

  const createMutation = useMutation({
    mutationKey: ['create-invoice'],
    mutationFn: async (payload: { contactPhone?: string; currency: string; items: InvoiceItem[]; autoSendTo?: string; sendText?: boolean }) => {
      const response = await client.post(endpoints.invoices.create, payload);
      return response?.data?.data as { invoice: InvoiceSummary; html?: string } | undefined;
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (payload?.invoice?.code) {
        notify.success({
          key: `invoice:${payload.invoice.code}`,
          title: 'Invoice created',
          description: `Invoice ${payload.invoice.code} is ready.`,
        });
        onSubmitted(payload.invoice.code);
      }
      setItems([{ name: '', qty: 1, unitPrice: 0 }]);
      setItemErrors([{}]);
      setContactPhone('');
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string }).message
          : 'Please try again shortly.';

      notify.error({
        key: 'invoice:create:error',
        title: 'Unable to create invoice',
        description: errorMessage,
      });
    },
  });

  const updateItems = React.useCallback((index: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  }, []);

  const addLineItem = () => {
    setItems((prev) => [...prev, { name: '', qty: 1, unitPrice: 0 }]);
    setItemErrors((prev) => [...prev, {}]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setItemErrors((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateItems = (): InvoiceItem[] => {
    const newErrors: ItemError[] = [];
    const normalized = items.map((item, index) => {
      const errors: ItemError = {};
      if (!item.name.trim()) {
        errors.name = 'Provide a description';
      }
      if (!item.qty || item.qty <= 0) {
        errors.qty = 'Quantity must be greater than 0';
      }
      if (Number.isNaN(item.unitPrice) || item.unitPrice < 0) {
        errors.unitPrice = 'Enter a valid price';
      }
      newErrors[index] = errors;
      return {
        name: item.name.trim(),
        qty: Number(item.qty) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      };
    });
    setItemErrors(newErrors);
    const validItems = normalized.filter((_, index) => Object.keys(newErrors[index] || {}).length === 0);
    return validItems;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const validItems = validateItems();

    if (validItems.length === 0) {
      setFormError('Add at least one invoice line with quantity and price.');
      return;
    }

    const shouldAutoSend =
      contactPhone.trim().length > 0 &&
      (await confirmDialog({
        title: 'Send invoice via WhatsApp?',
        description: 'We can text a payment request to this contact with the invoice link. Send it now?',
        confirmText: 'Send invoice',
        cancelText: 'Skip',
      }));

    createMutation.mutate({
      contactPhone: contactPhone.trim() || undefined,
      currency: currency.trim() || 'NGN',
      items: validItems,
      autoSendTo: shouldAutoSend ? contactPhone.trim() : undefined,
      sendText: shouldAutoSend,
    });

    if (!shouldAutoSend) {
      notify.info({
        key: 'invoice:auto-send:skip',
        title: 'Invoice ready',
        description: 'Share the invoice code with your customer or generate a receipt once paid.',
      });
    }
  };

  return (
    <Card>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-lg font-semibold'>Create Invoice</CardTitle>
        <p className='text-sm text-muted-foreground'>Capture payment line items and optionally send the invoice via WhatsApp.</p>
      </CardHeader>
      <CardContent>
        <form className='space-y-6' onSubmit={handleSubmit}>
          {formError ? (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Check the form</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='contactPhone'>Customer phone (WhatsApp)</Label>
              <Input id='contactPhone' placeholder='+2348012345678' value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='currency'>Currency</Label>
              <Input id='currency' value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder='NGN' />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-medium text-muted-foreground'>Line items</p>
              <Button type='button' size='sm' onClick={addLineItem}>
                <Plus className='mr-2 h-4 w-4' />
                Add item
              </Button>
            </div>
            <div className='space-y-4'>
              {items.map((item, index) => {
                const errors = itemErrors[index] || {};
                return (
                  <div key={index} className='rounded-lg border bg-muted/30 p-3'>
                    <div className='grid gap-3 sm:grid-cols-12'>
                      <div className='sm:col-span-6 space-y-1.5'>
                        <Label htmlFor={`item-name-${index}`} className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                          Description
                        </Label>
                        <Input
                          id={`item-name-${index}`}
                          value={item.name}
                          onChange={(event) => updateItems(index, { name: event.target.value })}
                          placeholder='Consultation, Product X...'
                        />
                        {errors.name ? <p className='text-xs text-destructive'>{errors.name}</p> : null}
                      </div>
                      <div className='sm:col-span-3 space-y-1.5'>
                        <Label htmlFor={`item-qty-${index}`} className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                          Quantity
                        </Label>
                        <Input
                          id={`item-qty-${index}`}
                          type='number'
                          min={1}
                          value={item.qty}
                          onChange={(event) => updateItems(index, { qty: Number(event.target.value) })}
                        />
                        {errors.qty ? <p className='text-xs text-destructive'>{errors.qty}</p> : null}
                      </div>
                      <div className='sm:col-span-3 space-y-1.5'>
                        <Label htmlFor={`item-price-${index}`} className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                          Unit price
                        </Label>
                        <Input
                          id={`item-price-${index}`}
                          type='number'
                          min={0}
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItems(index, {
                              unitPrice: Number(event.target.value),
                            })
                          }
                        />
                        {errors.unitPrice ? <p className='text-xs text-destructive'>{errors.unitPrice}</p> : null}
                      </div>
                    </div>
                    {items.length > 1 ? (
                      <div className='mt-2 flex justify-end'>
                        <Button type='button' variant='ghost' size='sm' onClick={() => removeItem(index)}>
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className='flex items-center justify-between border-t pt-4'>
            <div className='text-xs text-muted-foreground'>Totals calculated automatically • Invoices are sent with your default bank account</div>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
              Create invoice
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const InvoicesTable = ({
  items,
  onSelect,
  selectedCode,
  isRefreshing,
  onRefresh,
}: {
  items: InvoiceSummary[];
  onSelect: (invoice: InvoiceSummary) => void;
  selectedCode: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
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
              const isSelected = selectedCode === invoice.code;
              const statusConfig = statusTone[invoice.status] || statusTone.DEFAULT;
              return (
                <button
                  type='button'
                  key={invoice.id}
                  onClick={() => onSelect(invoice)}
                  className={cn(
                    'flex w-full flex-col rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between',
                    isSelected ? 'border-primary/60 bg-primary/5' : 'hover:border-muted-foreground/30 hover:bg-muted/40'
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
                  <div className='flex items-center gap-6 pt-3 text-sm sm:pt-0'>
                    <div className='text-right'>
                      <div className='font-medium text-foreground'>{formatCurrency(invoice.total, invoice.currency)}</div>
                      <div className='text-xs text-muted-foreground'>Outstanding {formatCurrency(invoice.outstanding, invoice.currency)}</div>
                    </div>
                    <ArrowRight className='hidden h-4 w-4 text-muted-foreground sm:block' />
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

const VerifyInvoiceButton = ({
  code,
  disabled,
  onComplete,
}: {
  code: string;
  disabled: boolean;
  onComplete: (receipt: ReceiptInfo | undefined) => void;
}) => {
  const queryClient = useQueryClient();
  const verifyMutation = useMutation({
    mutationKey: ['verify-payment', code],
    mutationFn: async () => {
      const response = await client.post(endpoints.invoices.verifyPayment(code), {});
      return response?.data?.data as
        | {
            receipt?: ReceiptInfo;
          }
        | undefined;
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', code] });
      notify.success({
        key: `invoice:${code}:verified`,
        title: 'Payment verified',
        description: 'Receipt issued and invoice marked as paid.',
      });
      onComplete(payload?.receipt);
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string }).message
          : 'Try again in a few moments.';

      notify.error({
        key: `invoice:${code}:verify-error`,
        title: 'Unable to verify payment',
        description: errorMessage,
      });
    },
  });

  const handleClick = async () => {
    const confirmed = await confirm({
      title: 'Mark invoice as paid?',
      description: 'This will generate a receipt and notify the buyer. Continue?',
      confirmText: 'Mark as paid',
      variant: 'destructive',
    });
    if (!confirmed) return;
    verifyMutation.mutate();
  };

  return (
    <Button size='sm' variant='outline' disabled={disabled || verifyMutation.isPending} onClick={handleClick}>
      {verifyMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CheckCircle className='mr-2 h-4 w-4' />}
      Mark as paid
    </Button>
  );
};

const InvoicesPage: React.FC = () => {
  const invoicesQuery = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceSummary | null>(null);
  const [latestReceipt, setLatestReceipt] = React.useState<ReceiptInfo | null>(null);

  const isLoading = invoicesQuery.isLoading;
  const hasInvoices = invoicesQuery.data?.items?.length;

  const handleSelect = (invoice: InvoiceSummary) => {
    setSelectedInvoice(invoice);
    setLatestReceipt(null);
  };

  const handleCreated = (code: string) => {
    const createdInvoice = invoicesQuery.data?.items.find((invoice) => invoice.code === code);
    if (createdInvoice) {
      setSelectedInvoice(createdInvoice);
    }
  };

  const handleReceiptCopied = () => {
    if (!latestReceipt) return;
    navigator.clipboard
      .writeText(latestReceipt.url)
      .then(() =>
        notify.success({
          key: `receipt:${latestReceipt.id}:copied`,
          title: 'Link copied',
          description: 'Receipt link copied to clipboard.',
        })
      )
      .catch(() =>
        notify.error({
          key: `receipt:${latestReceipt.id}:copy-error`,
          title: 'Clipboard error',
          description: 'Unable to copy the receipt link.',
        })
      );
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
        {!hasInvoices && (
          <Button
            className='w-full sm:w-auto'
            onClick={() => {
              confirm({
                title: 'Create your first invoice',
                description: 'Use the form to add customer details and line items.',
                confirmText: 'Got it',
              });
            }}
          >
            <Plus className='h-4 w-4 mr-2' />
            Create Invoice
          </Button>
        )}
      </div>

      {isLoading ? (
        <>
          <InvoiceSummarySkeleton />
          <InvoicesTableSkeleton />
        </>
      ) : hasInvoices ? (
        <>
          <InvoiceSummaryCards data={invoicesQuery.data} />
          <div className='grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
            <div className='space-y-6'>
              <InvoicesTable
                items={invoicesQuery.data!.items}
                onSelect={handleSelect}
                selectedCode={selectedInvoice?.code ?? null}
                isRefreshing={invoicesQuery.isRefetching}
                onRefresh={() => invoicesQuery.refetch()}
              />
              <InvoiceDetail code={selectedInvoice?.code ?? null} />
              {selectedInvoice ? (
                <div className='flex flex-wrap gap-3'>
                  <VerifyInvoiceButton
                    code={selectedInvoice.code}
                    disabled={selectedInvoice.isPaid}
                    onComplete={(receipt) => {
                      if (receipt) setLatestReceipt(receipt);
                    }}
                  />
                  {latestReceipt ? (
                    <div className='flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary'>
                      <Receipt className='h-4 w-4' />
                      <span>
                        Receipt {latestReceipt.number}{' '}
                        <Button size='sm' variant='link' className='px-1 text-sm' onClick={handleReceiptCopied}>
                          <ClipboardCopy className='mr-1 h-3.5 w-3.5' />
                          Copy link
                        </Button>
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <InvoiceForm onSubmitted={handleCreated} />
          </div>
        </>
      ) : (
        <>
          {/* How it Works - Step by Step */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5 text-primary' />
                  How it works
                </CardTitle>
                <div className='text-sm text-muted-foreground'>Generate professional invoices and track payments seamlessly</div>
              </CardHeader>
              <CardContent>
                <div className='grid gap-6 md:grid-cols-3'>
                  <Step number={1} icon={FileText} title='Create Invoice' description='Add customer details and line items with prices' />
                  <Step number={2} icon={CreditCard} title='Send & Track' description='Send to customers and monitor payment status' />
                  <Step number={3} icon={Receipt} title='Issue Receipt' description='Generate receipts once payments are verified' />
                </div>
              </CardContent>
            </Card>
          </section>

          <div className='grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
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
                  <Button
                    onClick={() => {
                      confirm({
                        title: 'Create your first invoice',
                        description: 'Use the panel on the right to add a customer and line items.',
                        confirmText: 'Got it',
                      });
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Create Your First Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
            <InvoiceForm onSubmitted={handleCreated} />
          </div>
        </>
      )}
    </div>
  );
};

export default InvoicesPage;
