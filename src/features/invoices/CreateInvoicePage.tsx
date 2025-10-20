import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, CreditCard, FileText, Loader2, Plus, Receipt, Save, Zap } from 'lucide-react';

import { endpoints } from '@/api/config';
import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/lib/toast';
import { useConfirm } from '@/ui/ux/confirm-dialog';

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

type ItemError = Partial<Record<keyof InvoiceItem, string>>;

const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
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
          title: 'Invoice created successfully',
          description: `Invoice ${payload.invoice.code} is ready to send to your customer.`,
        });
        navigate('/dashboard/invoices');
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

    // If there's a phone number, ask user if they want to send via WhatsApp
    if (contactPhone.trim().length > 0) {
      const shouldAutoSend = await confirmDialog({
        title: 'Send invoice via WhatsApp?',
        description: 'We can text a payment request to this contact with the invoice link. Send it now?',
        confirmText: 'Send invoice',
        cancelText: 'Cancel',
      });

      // If user cancels, don't create the invoice at all
      if (!shouldAutoSend) {
        return;
      }

      // User confirmed, create invoice and send via WhatsApp
      createMutation.mutate({
        contactPhone: contactPhone.trim(),
        currency: currency.trim() || 'NGN',
        items: validItems,
        autoSendTo: contactPhone.trim(),
        sendText: true,
      });
    } else {
      // No phone number, just create the invoice
      createMutation.mutate({
        contactPhone: undefined,
        currency: currency.trim() || 'NGN',
        items: validItems,
        autoSendTo: undefined,
        sendText: false,
      });

      notify.info({
        key: 'invoice:auto-send:skip',
        title: 'Invoice ready',
        description: 'Share the invoice code with your customer or generate a receipt once paid.',
      });
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='sm' onClick={() => navigate('/dashboard/invoices')}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Invoices
          </Button>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Create Invoice</h1>
            <p className='text-sm sm:text-base text-muted-foreground'>Add customer details and line items to create a professional invoice.</p>
          </div>
        </div>
      </div>

      {/* How it Works - Step by Step */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='h-5 w-5 text-primary' />
              How it works
            </CardTitle>
            <CardDescription>Create invoices and track payments with receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-3'>
              <Step number={1} icon={FileText} title='Add Details' description='Enter customer info and invoice line items' />
              <Step number={2} icon={CreditCard} title='Send & Track' description='Send to customer and monitor payment status' />
              <Step number={3} icon={Receipt} title='Issue Receipt' description='Generate receipts once payments are confirmed' />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Invoice Form */}
      <Card>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-lg font-semibold'>Invoice Details</CardTitle>
          <p className='text-sm text-muted-foreground'>Fill in the customer details and add line items for your invoice.</p>
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
                <Input
                  id='contactPhone'
                  placeholder='+2348012345678'
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
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
              <div className='flex gap-2'>
                <Button type='button' variant='outline' onClick={() => navigate('/dashboard/invoices')}>
                  Cancel
                </Button>
                <Button type='submit' disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
                  Create Invoice
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateInvoicePage;
