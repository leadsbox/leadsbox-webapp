import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ClipboardCopy,
  Loader2,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/toast';
import { confirm } from '@/ui/ux/confirm-dialog';

import {
  InvoiceDetailResponse,
  InvoiceItem,
  ReceiptInfo,
  formatCurrency,
  parseItems,
  statusTone,
} from './invoiceTypes';

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

const InvoiceDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [latestReceipt, setLatestReceipt] = React.useState<ReceiptInfo | null>(null);

  const detailQuery = useInvoiceDetail(code);
  const { data, isLoading, isError, refetch, isRefetching } = detailQuery;

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

  React.useEffect(() => {
    setLatestReceipt(null);
  }, [code]);

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' onClick={() => navigate('/dashboard/invoices')}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to invoices
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isLoading || isRefetching || !code}
          >
            {isRefetching ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
            Refresh
          </Button>
        </div>
        <Button size='sm' onClick={() => navigate('/dashboard/invoices/new')}>
          Create invoice
        </Button>
      </div>

      {!code ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing invoice code</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>Select an invoice from the list to view its details.</CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Invoice details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-4 w-64' />
            <Skeleton className='h-48 w-full' />
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <Card>
          <CardHeader>
            <CardTitle>Invoice details</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Unable to load invoice</AlertTitle>
              <AlertDescription>Try refreshing the page or return to the invoices list.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card className='space-y-6'>
          <CardHeader className='flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <CardTitle className='text-2xl font-semibold text-foreground'>Invoice {data.invoice.code}</CardTitle>
                <Badge className={cn('px-3 py-1 text-sm', (statusTone[data.invoice.status] || statusTone.DEFAULT).badgeClass)}>
                  {(statusTone[data.invoice.status] || statusTone.DEFAULT).label}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                <span>Created {formatDistanceToNow(new Date(data.invoice.createdAt), { addSuffix: true })}</span>
                <span aria-hidden>•</span>
                <span>Total {formatCurrency(data.invoice.total, data.invoice.currency)}</span>
              </div>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <VerifyInvoiceButton
                code={data.invoice.code}
                disabled={data.invoice.isPaid}
                onComplete={(receipt) => {
                  if (receipt) {
                    setLatestReceipt(receipt);
                  }
                  refetch();
                }}
              />
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            {latestReceipt ? (
              <div className='flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary'>
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

            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>Line items</h3>
              <ItemsTable items={data.invoice.items} />
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
              <div className='space-y-3 rounded-md border bg-muted/30 p-4 text-sm'>
                <div className='font-medium text-muted-foreground'>Payment summary</div>
                <div className='space-y-1'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Amount due</span>
                    <span className='font-medium text-foreground'>{formatCurrency(data.invoice.total, data.invoice.currency)}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm text-muted-foreground'>
                    <span>Collected</span>
                    <span>{formatCurrency(data.invoice.totalPaid, data.invoice.currency)}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Outstanding</span>
                    <span
                      className={cn(
                        'font-semibold',
                        data.invoice.outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {formatCurrency(data.invoice.outstanding, data.invoice.currency)}
                    </span>
                  </div>
                  {data.bank ? (
                    <div className='mt-3 rounded-md bg-background/80 p-3 text-xs text-muted-foreground'>
                      <div className='font-medium text-foreground'>Payment instructions</div>
                      <div>{data.bank.accountName}</div>
                      <div>{data.bank.bankName}</div>
                      <div>{data.bank.accountNumber}</div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-medium text-muted-foreground'>Receipts</h3>
                  {data.invoice.receiptCount > 0 ? <Badge variant='outline'>{data.invoice.receiptCount} issued</Badge> : null}
                </div>
                <ReceiptsList receipts={data.invoice.receipts} />
              </div>
            </div>

            {data.html ? (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                  <Receipt className='h-4 w-4' />
                  Invoice preview
                </div>
                <div className='rounded-md border'>
                  <iframe title={`Invoice ${data.invoice.code}`} className='h-[480px] w-full rounded-md bg-background' srcDoc={data.html} />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceDetailPage;
