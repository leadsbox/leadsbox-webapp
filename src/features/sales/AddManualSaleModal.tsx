import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { salesApi, SaleItem } from '@/api/sales';
import { notify } from '@/lib/toast';

interface AddManualSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onSuccess?: () => void;
}

export const AddManualSaleModal: React.FC<AddManualSaleModalProps> = ({ open, onOpenChange, leadId, onSuccess }) => {
  const [items, setItems] = useState<SaleItem[]>([{ name: '', quantity: 1, unitPrice: 0 }]);
  const [currency, setCurrency] = useState('NGN');
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'PARTIAL'>('PAID');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = async () => {
    // Validation
    const validItems = items.filter((item) => item.name && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      notify.error({ title: 'Invalid Items', description: 'Please add at least one valid item' });
      return;
    }

    try {
      setIsSubmitting(true);
      await salesApi.create({
        leadId,
        items: validItems,
        currency,
        amount: calculateTotal(),
        status,
        isManual: true,
      });

      notify.success({ title: 'Sale Created', description: 'Manual sale added successfully' });
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setItems([{ name: '', quantity: 1, unitPrice: 0 }]);
    } catch (error) {
      notify.error({ title: 'Failed to create sale', description: 'Please try again' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Add Manual Sale</DialogTitle>
          <DialogDescription>Record a sale transaction manually. This sale will be tagged as "Manual".</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Currency and Status */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='NGN'>NGN (₦)</SelectItem>
                  <SelectItem value='USD'>USD ($)</SelectItem>
                  <SelectItem value='EUR'>EUR (€)</SelectItem>
                  <SelectItem value='GBP'>GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'PENDING' | 'PAID' | 'PARTIAL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PAID'>Paid</SelectItem>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='PARTIAL'>Partially Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div className='space-y-3'>
            <Label>Items</Label>
            {items.map((item, index) => (
              <div key={index} className='flex gap-2 items-end'>
                <div className='flex-1 space-y-2'>
                  <Input placeholder='Item name' value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} />
                </div>
                <div className='w-24 space-y-2'>
                  <Input
                    type='number'
                    placeholder='Qty'
                    min='1'
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className='w-32 space-y-2'>
                  <Input
                    type='number'
                    placeholder='Price'
                    min='0'
                    step='0.01'
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button variant='ghost' size='icon' onClick={() => removeItem(index)} disabled={items.length === 1}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))}

            <Button variant='outline' size='sm' onClick={addItem} className='w-full'>
              <Plus className='h-4 w-4 mr-2' />
              Add Item
            </Button>
          </div>

          {/* Total */}
          <div className='border-t pt-4'>
            <div className='flex justify-between items-center text-lg font-semibold'>
              <span>Total</span>
              <span>
                {currency} {calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
