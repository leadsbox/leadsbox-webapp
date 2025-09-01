import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ReceiptPage: React.FC = () => {
  const { receiptId } = useParams();
  const [html, setHtml] = useState<string>('');
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!receiptId) return;
      setLoading(true);
      try {
        const res = await client.get(`/invoices/receipts/${receiptId}`);
        const payload = res?.data?.data || {};
        setHtml(payload.html || '');
        setMeta(payload.receipt || null);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    })();
  }, [receiptId]);

  return (
    <div className='p-4 sm:p-6 space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Receipt</h1>
        <Button asChild variant='outline'>
          <Link to='/dashboard/invoices'>Back to Invoices</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Receipt Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading…</div>}
          {error && <div className='text-destructive'>{error}</div>}
          {!loading && !error && (
            <div className='space-y-3'>
              {meta && (
                <div className='text-sm text-muted-foreground'>
                  <div>Receipt Number: <b>{meta.receiptNumber}</b></div>
                  {meta.invoiceCode && <div>Invoice: <b>{meta.invoiceCode}</b></div>}
                </div>
              )}
              {html && (
                <div className='border rounded-md p-3 overflow-auto max-h-[70vh] bg-background' dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptPage;

