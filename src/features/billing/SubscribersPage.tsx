import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, Users } from 'lucide-react';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { notify } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type SubscriberStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED';

interface SubscriberRow {
  subscriptionId: string;
  organizationName: string;
  ownerEmail: string;
  ownerName: string | null;
  planName: string;
  planInterval: string;
  status: SubscriberStatus;
  amountMajor: number;
  currency: string;
  reference: string | null;
  paystackSubscriptionId: string | null;
  paystackCustomerCode: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

interface SubscribersResponse {
  data: {
    summary: {
      totalRows: number;
      latestOnly: boolean;
      byStatus: Record<string, number>;
      mrrEstimate: number;
    };
    subscribers: SubscriberRow[];
  };
}

const statusBadgeClass = (status: SubscriberStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'PAST_DUE':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'PENDING':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'CANCELED':
    case 'EXPIRED':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatAmount = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: currency === 'NGN' ? 0 : 2,
    }).format(amount || 0);
  } catch {
    return `${currency || 'NGN'} ${Number(amount || 0).toLocaleString()}`;
  }
};

const SubscribersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [latestOnly, setLatestOnly] = useState<'LATEST' | 'ALL'>('LATEST');
  const [summary, setSummary] = useState<SubscribersResponse['data']['summary']>({
    totalRows: 0,
    latestOnly: true,
    byStatus: {},
    mrrEstimate: 0,
  });
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);

  const fetchSubscribers = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params: Record<string, string | boolean> = {
          latestOnly: latestOnly === 'LATEST',
          limit: '1000',
        };
        if (search.trim()) params.search = search.trim();
        if (status !== 'ALL') params.status = status;

        const response = await client.get(endpoints.metrics.subscribers, {
          params,
        });

        const payload = response?.data?.data || {};
        setSummary(
          payload?.summary || {
            totalRows: 0,
            latestOnly: latestOnly === 'LATEST',
            byStatus: {},
            mrrEstimate: 0,
          },
        );
        setSubscribers(payload?.subscribers || []);
        setForbidden(false);
      } catch (error: any) {
        const statusCode = error?.response?.status;
        if (statusCode === 403) {
          setForbidden(true);
          setSubscribers([]);
          return;
        }
        notify.error({
          key: 'subscribers:load:error',
          title: 'Unable to load subscribers',
          description: 'Please try again shortly.',
        });
      } finally {
        if (background) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [latestOnly, search, status],
  );

  useEffect(() => {
    void fetchSubscribers();
  }, [fetchSubscribers]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const params: Record<string, string | boolean> = {
        latestOnly: latestOnly === 'LATEST',
        format: 'csv',
        limit: '5000',
      };
      if (search.trim()) params.search = search.trim();
      if (status !== 'ALL') params.status = status;

      const response = await client.get(endpoints.metrics.subscribers, {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `subscribers-${latestOnly === 'LATEST' ? 'latest' : 'all'}-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      notify.error({
        key: 'subscribers:export:error',
        title: 'Export failed',
        description: 'Could not export subscribers right now.',
      });
    } finally {
      setExporting(false);
    }
  }, [latestOnly, search, status]);

  const counts = useMemo(
    () => ({
      active: summary.byStatus?.ACTIVE || 0,
      pending: summary.byStatus?.PENDING || 0,
      pastDue: summary.byStatus?.PAST_DUE || 0,
    }),
    [summary.byStatus],
  );

  if (forbidden) {
    return (
      <div className='p-4 sm:p-6 space-y-4'>
        <h1 className='text-2xl sm:text-3xl font-bold'>Subscribers</h1>
        <Card>
          <CardContent className='p-6 text-sm text-muted-foreground'>
            Subscribers report is restricted. Add your email to `METRICS_ADMIN_EMAILS` to access this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>Subscribers</h1>
          <p className='text-sm text-muted-foreground'>
            Central view of subscription records with customer and plan details.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => fetchSubscribers({ background: true })}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.totalRows}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{counts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>MRR Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatAmount(summary.mrrEstimate, 'NGN')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='p-4 space-y-4'>
          <div className='flex flex-col md:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search className='h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
              <Input
                className='pl-9'
                placeholder='Search org, owner email, customer code, reference...'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-full md:w-[180px]'>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All statuses</SelectItem>
                <SelectItem value='ACTIVE'>ACTIVE</SelectItem>
                <SelectItem value='PENDING'>PENDING</SelectItem>
                <SelectItem value='PAST_DUE'>PAST_DUE</SelectItem>
                <SelectItem value='CANCELED'>CANCELED</SelectItem>
                <SelectItem value='EXPIRED'>EXPIRED</SelectItem>
              </SelectContent>
            </Select>
            <Select value={latestOnly} onValueChange={(value) => setLatestOnly(value as 'LATEST' | 'ALL')}>
              <SelectTrigger className='w-full md:w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='LATEST'>Latest per org</SelectItem>
                <SelectItem value='ALL'>All records</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchSubscribers()} disabled={loading}>
              <Users className='h-4 w-4 mr-2' />
              Apply
            </Button>
          </div>

          <div className='overflow-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Current Period End</TableHead>
                  <TableHead>Customer Code</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className='h-4 w-32' /></TableCell>
                      <TableCell><Skeleton className='h-4 w-40' /></TableCell>
                      <TableCell><Skeleton className='h-4 w-28' /></TableCell>
                      <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                      <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                      <TableCell><Skeleton className='h-4 w-28' /></TableCell>
                      <TableCell><Skeleton className='h-4 w-32' /></TableCell>
                      <TableCell><Skeleton className='h-4 w-28' /></TableCell>
                    </TableRow>
                  ))
                ) : subscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                      No subscriber records found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  subscribers.map((row) => (
                    <TableRow key={row.subscriptionId}>
                      <TableCell className='font-medium'>{row.organizationName}</TableCell>
                      <TableCell>{row.ownerName ? `${row.ownerName} (${row.ownerEmail})` : row.ownerEmail}</TableCell>
                      <TableCell>
                        {row.planName}
                        <div className='text-xs text-muted-foreground'>{row.planInterval}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusBadgeClass(row.status)}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatAmount(row.amountMajor, row.currency)}</TableCell>
                      <TableCell>
                        {row.currentPeriodEnd
                          ? new Date(row.currentPeriodEnd).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className='font-mono text-xs'>{row.paystackCustomerCode || '—'}</TableCell>
                      <TableCell className='font-mono text-xs'>{row.reference || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscribersPage;
