import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quotesApi, Quote, QuoteStatus } from '@/api/quotes';
import { productsApi } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, FileText, ArrowRight, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const QuotesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    items: [{ productId: '', name: '', qty: 1, unitPrice: 0 }],
    discount: 0,
    taxRate: 0,
    validUntil: '',
    notes: '',
  });

  // Fetch quotes
  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['quotes', { status: statusFilter }],
    queryFn: () => quotesApi.list({ status: statusFilter || undefined }),
  });

  // Fetch products for selection
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  });

  // Create quote
  const createMutation = useMutation({
    mutationFn: quotesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote created successfully');
      closeDialog();
    },
    onError: () => {
      toast.error('Failed to create quote');
    },
  });

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) => quotesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Convert to invoice
  const convertMutation = useMutation({
    mutationFn: quotesApi.convertToInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote converted to invoice');
      // Navigate to invoice detail if you have the code
      // navigate(`/dashboard/invoices/${data.data.invoice.code}`);
    },
    onError: () => {
      toast.error('Failed to convert quote');
    },
  });

  const openDialog = () => {
    setFormData({
      items: [{ productId: '', name: '', qty: 1, unitPrice: 0 }],
      discount: 0,
      taxRate: 0,
      validUntil: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const quoteData = {
      items: formData.items.map((item) => ({
        productId: item.productId || undefined,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
      })),
      discount: formData.discount,
      taxRate: formData.taxRate,
      validUntil: formData.validUntil || undefined,
      notes: formData.notes || undefined,
    };

    createMutation.mutate(quoteData);
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', name: '', qty: 1, unitPrice: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product selected, auto-fill details
    if (field === 'productId' && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].name = product.name;
        newItems[index].unitPrice = product.unitPrice;
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const quotes = quotesData?.data?.quotes || [];
  const products = productsData?.data?.products || [];

  const getStatusBadge = (status: QuoteStatus) => {
    const variants: Record<QuoteStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      SENT: { variant: 'default', label: 'Sent' },
      ACCEPTED: { variant: 'default', label: 'Accepted' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      EXPIRED: { variant: 'outline', label: 'Expired' },
      CONVERTED: { variant: 'default', label: 'Converted' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Quotes</h1>
          <p className='text-muted-foreground'>Create and manage sales quotes</p>
        </div>
        <Button onClick={openDialog}>
          <Plus className='h-4 w-4 mr-2' />
          Create Quote
        </Button>
      </div>

      {/* Filters */}
      <div className='flex gap-4'>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='All Statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>All Statuses</SelectItem>
            <SelectItem value='DRAFT'>Draft</SelectItem>
            <SelectItem value='SENT'>Sent</SelectItem>
            <SelectItem value='ACCEPTED'>Accepted</SelectItem>
            <SelectItem value='REJECTED'>Rejected</SelectItem>
            <SelectItem value='EXPIRED'>Expired</SelectItem>
            <SelectItem value='CONVERTED'>Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes Table */}
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8'>
                  Loading...
                </TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8'>
                  <FileText className='h-12 w-12 mx-auto text-muted-foreground mb-2' />
                  <p className='text-muted-foreground'>No quotes found</p>
                  <Button variant='link' onClick={openDialog}>
                    Create your first quote
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className='font-medium'>{quote.code}</TableCell>
                  <TableCell>
                    {quote.total.toLocaleString()} {quote.currency}
                  </TableCell>
                  <TableCell>{quote.items.length} items</TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className='text-right space-x-2'>
                    {quote.status === 'ACCEPTED' && (
                      <Button size='sm' onClick={() => convertMutation.mutate(quote.id)} disabled={convertMutation.isPending}>
                        <ArrowRight className='h-4 w-4 mr-1' />
                        Convert to Invoice
                      </Button>
                    )}
                    {quote.status === 'DRAFT' && (
                      <Button size='sm' variant='outline' onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'SENT' })}>
                        Mark as Sent
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quote Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Quote</DialogTitle>
            <DialogDescription>Create a new quote for your customer</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4 py-4'>
              {/* Line Items */}
              <div className='space-y-2'>
                <Label>Items</Label>
                {formData.items.map((item, index) => (
                  <div key={index} className='grid grid-cols-12 gap-2 items-end'>
                    <div className='col-span-4'>
                      <Select value={item.productId} onValueChange={(value) => updateLineItem(index, 'productId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select product' />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='col-span-3'>
                      <Input placeholder='Item name' value={item.name} onChange={(e) => updateLineItem(index, 'name', e.target.value)} required />
                    </div>
                    <div className='col-span-2'>
                      <Input
                        type='number'
                        placeholder='Qty'
                        value={item.qty}
                        onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div className='col-span-2'>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='Price'
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className='col-span-1'>
                      <Button type='button' variant='ghost' size='icon' onClick={() => removeLineItem(index)} disabled={formData.items.length === 1}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type='button' variant='outline' size='sm' onClick={addLineItem}>
                  <Plus className='h-4 w-4 mr-1' />
                  Add Item
                </Button>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='discount'>Discount (%)</Label>
                  <Input
                    id='discount'
                    type='number'
                    step='0.01'
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='taxRate'>Tax Rate (%)</Label>
                  <Input
                    id='taxRate'
                    type='number'
                    step='0.01'
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='validUntil'>Valid Until</Label>
                <Input
                  id='validUntil'
                  type='date'
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='notes'>Notes</Label>
                <Input id='notes' value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={closeDialog}>
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending}>
                Create Quote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotesPage;
