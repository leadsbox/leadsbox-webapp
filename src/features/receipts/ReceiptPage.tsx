import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, FileText, Loader2, RefreshCw } from 'lucide-react';

import { API_BASE, endpoints } from '@/api/config';
import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { notify } from '@/lib/toast';

type ReceiptDetail = {
  receipt: {
    id: string;
    receiptNumber: string;
    amount: number;
    currency: string;
    buyerName: string;
    sellerName: string;
    createdAt: string;
    invoiceCode?: string;
  };
  html?: string;
};

const useReceipt = (receiptId?: string) =>
  useQuery({
    queryKey: ['receipt', receiptId],
    enabled: Boolean(receiptId),
    queryFn: async () => {
      if (!receiptId) return undefined;
      const response = await client.get(
        endpoints.invoices.receipt(receiptId)
      );
      return response?.data?.data as ReceiptDetail | undefined;
    },
  });

const ReceiptPage: React.FC = () => {
  const { receiptId } = useParams<{ receiptId: string }>();
  const receiptQuery = useReceipt(receiptId);

  const handleRefresh = () => {
    receiptQuery.refetch().catch(() =>
      notify.error({
        key: `receipt:${receiptId}:refresh-error`,
        title: 'Unable to refresh receipt',
        description: 'Try again in a moment.',
      })
    );
  };

  const isLoading = receiptQuery.isLoading;
  const hasData = Boolean(receiptQuery.data?.receipt);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Receipt</h1>
          <p className="text-sm text-muted-foreground">
            View payment confirmation details for your customer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/invoices">Back to invoices</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={receiptQuery.isRefetching}
          >
            {receiptQuery.isRefetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Receipt details
          </CardTitle>
          {hasData ? (
            <Button asChild size="sm">
              <a
                href={`${API_BASE}${endpoints.invoices.receipt(
                  receiptQuery.data!.receipt.id
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-[420px] w-full" />
            </div>
          ) : receiptQuery.isError || !receiptId ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Receipt unavailable</AlertTitle>
              <AlertDescription>
                We couldn&rsquo;t load this receipt. Check the link and try again.
              </AlertDescription>
            </Alert>
          ) : !receiptQuery.data ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not found</AlertTitle>
              <AlertDescription>
                We don&rsquo;t have a receipt with that identifier.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border bg-muted/40 p-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Receipt number
                  </div>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    {receiptQuery.data.receipt.receiptNumber}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Issued on{' '}
                    {format(new Date(receiptQuery.data.receipt.createdAt), 'PPp')}
                  </div>
                  {receiptQuery.data.receipt.invoiceCode ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Linked invoice{' '}
                      <Link
                        to={`/dashboard/invoices`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {receiptQuery.data.receipt.invoiceCode}
                      </Link>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2 rounded-md border bg-background p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: receiptQuery.data.receipt.currency || 'NGN',
                        maximumFractionDigits: 2,
                      }).format(receiptQuery.data.receipt.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Seller</span>
                    <span>{receiptQuery.data.receipt.sellerName}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Buyer</span>
                    <span>{receiptQuery.data.receipt.buyerName}</span>
                  </div>
                </div>
              </div>

              {receiptQuery.data.html ? (
                <div className="rounded-md border">
                  <iframe
                    title="Receipt preview"
                    className="h-[480px] w-full rounded-md bg-background"
                    srcDoc={receiptQuery.data.html}
                  />
                </div>
              ) : (
                <div className="rounded-md border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
                  No preview available for this receipt.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptPage;
