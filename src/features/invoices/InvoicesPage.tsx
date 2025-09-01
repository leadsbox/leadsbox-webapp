import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Save } from 'lucide-react';
import client from '@/api/client';
import { toast } from 'react-toastify';

type Item = { name: string; qty: number; unitPrice: number };

const InvoicesPage: React.FC = () => {
  const [contactPhone, setContactPhone] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [items, setItems] = useState<Item[]>([{ name: '', qty: 1, unitPrice: 0 }]);
  const [creating, setCreating] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [html, setHtml] = useState<string>('');

  const addItem = () => setItems((prev) => [...prev, { name: '', qty: 1, unitPrice: 0 }]);
  const updateItem = (i: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const createInvoice = async () => {
    const cleanItems = items.filter((it) => it.name && it.qty > 0 && it.unitPrice >= 0);
    if (cleanItems.length === 0) {
      toast.error('Add at least one valid item');
      return;
    }
    setCreating(true);
    try {
      const res = await client.post('/invoices', {
        items: cleanItems,
        currency,
        contactPhone: contactPhone || undefined,
      });
      const payload = res?.data?.data || {};
      setLastInvoice(payload.invoice || null);
      setHtml(payload.html || '');
      toast.success('Invoice created');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-6'>
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Invoices</h1>
        <p className='text-sm text-muted-foreground'>Create and send payment invoices</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <Label>Customer Phone (WhatsApp)</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder='+234...' />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder='NGN' />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <h3 className='font-medium'>Items</h3>
              <Button size='sm' onClick={addItem}>
                <Plus className='h-4 w-4 mr-1' /> Add Item
              </Button>
            </div>
            {items.map((it, i) => (
              <div key={i} className='grid grid-cols-1 md:grid-cols-12 gap-2'>
                <div className='md:col-span-6'>
                  <Input value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder='Item name' />
                </div>
                <div className='md:col-span-3'>
                  <Input type='number' value={it.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} placeholder='Qty' />
                </div>
                <div className='md:col-span-3'>
                  <Input type='number' value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} placeholder='Unit price' />
                </div>
              </div>
            ))}
          </div>

          <div className='flex justify-end'>
            <Button onClick={createInvoice} disabled={creating}>
              <Save className='h-4 w-4 mr-2' /> Create Invoice
            </Button>
          </div>

          {lastInvoice && (
            <div className='mt-4 space-y-2'>
              <div className='text-sm'>Invoice Code: <b>{lastInvoice.code}</b></div>
              {html && (
                <div className='border rounded-md p-3 overflow-auto max-h-96 bg-background' dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesPage;

