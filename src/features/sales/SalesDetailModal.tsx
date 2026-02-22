import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sale, SaleItem, salesApi, UpdateSaleInput } from '@/api/sales';
import { notify } from '@/lib/toast';
import { AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

const GENERIC_PRODUCT_NAMES = ['conversation payment', 'payment', 'sale', 'order', 'transaction'];
const isGenericName = (name: string) => GENERIC_PRODUCT_NAMES.includes(name.toLowerCase().trim());

interface SalesDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void | Promise<void>;
  onReject?: (id: string) => void | Promise<void>;
  onUpdate?: (id: string, data: UpdateSaleInput) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}

const SalesDetailModal: React.FC<SalesDetailModalProps> = ({ sale, isOpen, onClose, onApprove, onReject, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<SaleItem[]>([]);
  const [editedCurrency, setEditedCurrency] = useState('NGN');
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    confirmLabel: string;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {},
    confirmLabel: 'Confirm',
  });

  React.useEffect(() => {
    if (sale) {
      setEditedItems(sale.items);
      setEditedCurrency(sale.currency);
      setIsEditing(false);
    }
  }, [sale]);

  if (!sale) return null;
  const isPendingDecision = sale.reviewStatus ? sale.reviewStatus === 'PENDING_REVIEW' : !sale.approvedAt;

  const calculateTotal = (items: SaleItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      if (onApprove) {
        await onApprove(sale.id);
      } else {
        await salesApi.approve(sale.id);
        notify.success({
          key: `sale-approved-${sale.id}`,
          title: 'Sale Approved',
          description: 'The sale has been approved successfully.',
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to approve sale:', error);
      if (!onApprove) {
        notify.error({
          key: `sale-approve-error-${sale.id}`,
          title: 'Approval Failed',
          description: 'Failed to approve the sale. Please try again.',
        });
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = () => {
    setAlertConfig({
      open: true,
      title: 'Delete Sale',
      description: 'Are you sure you want to delete this sale? This action cannot be undone.',
      variant: 'destructive',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          setIsDeleting(true);
          if (onDelete) {
            await onDelete(sale.id);
          } else {
            await salesApi.delete(sale.id);
            notify.success({
              key: `sale-deleted-${sale.id}`,
              title: 'Sale Deleted',
              description: 'The sale has been deleted.',
            });
          }
          onClose();
        } catch (error) {
          console.error('Failed to delete sale:', error);
          if (!onDelete) {
            notify.error({
              key: `sale-delete-error-${sale.id}`,
              title: 'Delete Failed',
              description: 'Failed to delete the sale. Please try again.',
            });
          }
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const handleReject = () => {
    setAlertConfig({
      open: true,
      title: 'Reject Sale',
      description: 'Reject this AI-detected sale? It will be removed from the review queue.',
      confirmLabel: 'Reject',
      action: async () => {
        try {
          setIsRejecting(true);
          if (onReject) {
            await onReject(sale.id);
          } else {
            await salesApi.reject(sale.id);
            notify.success({
              key: `sale-rejected-${sale.id}`,
              title: 'Sale rejected',
              description: 'The sale has been removed from AI review queue.',
            });
          }
          onClose();
        } catch (error) {
          console.error('Failed to reject sale:', error);
          if (!onReject) {
            notify.error({
              key: `sale-reject-error-${sale.id}`,
              title: 'Rejection failed',
              description: 'Failed to reject this sale. Please try again.',
            });
          }
        } finally {
          setIsRejecting(false);
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const total = calculateTotal(editedItems);
      const updateData: UpdateSaleInput = {
        items: editedItems,
        currency: editedCurrency,
        amount: total,
      };

      if (onUpdate) {
        await onUpdate(sale.id, updateData);
      } else {
        await salesApi.update(sale.id, updateData);
        notify.success({
          key: `sale-updated-${sale.id}`,
          title: 'Sale Updated',
          description: 'The sale has been updated successfully.',
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update sale:', error);
      if (!onUpdate) {
        notify.error({
          key: `sale-update-error-${sale.id}`,
          title: 'Update Failed',
          description: 'Failed to update the sale. Please try again.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (sale.status === 'PAID') return;
    try {
      setIsMarkingPaid(true);
      if (onUpdate) {
        await onUpdate(sale.id, { status: 'PAID' });
      } else {
        await salesApi.update(sale.id, { status: 'PAID' });
        notify.success({
          key: `sale-mark-paid-${sale.id}`,
          title: 'Sale marked as paid',
          description: 'Payment status has been updated.',
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to mark sale as paid:', error);
      if (!onUpdate) {
        notify.error({
          key: `sale-mark-paid-error-${sale.id}`,
          title: 'Update Failed',
          description: 'Unable to mark this sale as paid.',
        });
      }
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const removeItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setEditedItems([...editedItems, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const displayItems = isEditing ? editedItems : sale.items;
  const displayTotal = calculateTotal(displayItems);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Sale Details
            {sale.isAutoDetected && (
              <Badge variant='secondary' className='text-xs'>
                Auto-Detected
              </Badge>
            )}
            {sale.approvedAt && (
              <Badge variant='default' className='text-xs bg-green-600'>
                Approved
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {sale.isAutoDetected && isPendingDecision ? 'Review and approve this auto-detected sale' : 'View sale details'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* AI Detection Info */}
          {sale.isAutoDetected && (
            <Card className='p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'>
              <div className='space-y-2'>
                <div>
                  <Label className='text-xs text-muted-foreground'>AI Confidence</Label>
                  <div className='font-medium'>{((sale.detectionConfidence || 0) * 100).toFixed(0)}%</div>
                </div>
                {sale.detectionReasoning && (
                  <div>
                    <Label className='text-xs text-muted-foreground'>AI Reasoning</Label>
                    <p className='text-sm'>{sale.detectionReasoning}</p>
                  </div>
                )}
                {isEditing && (
                  <p className='text-xs text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1'>
                    <AlertCircle className='h-3 w-3 shrink-0' />
                    The product name was detected from the conversation. You can edit it in the items below.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Contact Info */}
          {sale.lead?.contact && (
            <div>
              <Label className='text-sm font-medium'>Customer</Label>
              <p className='text-sm text-muted-foreground'>
                {sale.lead.contact.displayName || sale.lead.contact.waId || sale.lead.contact.phone || 'Unknown'}
              </p>
            </div>
          )}

          {/* Currency */}
          <div>
            <Label htmlFor='currency'>Currency</Label>
            {isEditing ? (
              <Input
                id='currency'
                value={editedCurrency}
                onChange={(e) => setEditedCurrency(e.target.value)}
                placeholder='e.g., NGN, USD'
                className='max-w-xs'
              />
            ) : (
              <p className='text-sm font-medium'>{sale.currency}</p>
            )}
          </div>

          {/* Items */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label>Items</Label>
              {isEditing && (
                <Button type='button' variant='outline' size='sm' onClick={addItem}>
                  Add Item
                </Button>
              )}
            </div>

            <div className='space-y-2'>
              {displayItems.map((item, index) => (
                <Card key={index} className='p-3'>
                  {isEditing ? (
                    <div className='grid grid-cols-12 gap-2 items-end'>
                      <div className='col-span-5'>
                        <Label className='text-xs flex items-center gap-1'>
                          Product Name
                          {isGenericName(item.name) && (
                            <span className='ml-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400'>
                              <AlertCircle className='h-3 w-3' /> Edit suggested
                            </span>
                          )}
                        </Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder='e.g. iPhone 15 Pro, Consultation'
                          className={isGenericName(item.name) ? 'border-amber-400 focus-visible:ring-amber-400' : ''}
                        />
                      </div>
                      <div className='col-span-2'>
                        <Label className='text-xs'>Qty</Label>
                        <Input type='number' value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} min='1' />
                      </div>
                      <div className='col-span-3'>
                        <Label className='text-xs'>Unit Price</Label>
                        <Input
                          type='number'
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                          min='0'
                          step='0.01'
                        />
                      </div>
                      <div className='col-span-2 flex items-center gap-2'>
                        <span className='text-sm font-medium'>{(item.quantity * item.unitPrice).toLocaleString()}</span>
                        <Button type='button' variant='ghost' size='sm' onClick={() => removeItem(index)} className='p-1 h-8 w-8'>
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex justify-between items-center'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium'>{item.name}</p>
                          {sale.isAutoDetected && isGenericName(item.name) && (
                            <Badge variant='outline' className='text-[10px] px-1.5 py-0 border-amber-400 text-amber-600 dark:text-amber-400'>
                              AI detected – tap Edit to update
                            </Badge>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {item.quantity} × {item.unitPrice.toLocaleString()} {sale.currency}
                        </p>
                      </div>
                      <p className='font-medium'>
                        {(item.quantity * item.unitPrice).toLocaleString()} {sale.currency}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className='flex justify-between items-center pt-4 border-t'>
            <Label className='text-lg'>Total</Label>
            <p className='text-lg font-bold'>
              {displayTotal.toLocaleString()} {isEditing ? editedCurrency : sale.currency}
            </p>
          </div>
        </div>

        <DialogFooter className='flex flex-wrap gap-2 sm:space-x-0 pt-4 mt-2 justify-end'>
          {!isEditing ? (
            <>
              <Button variant='outline' onClick={onClose}>
                Close
              </Button>
              {sale.status !== 'PAID' && (
                <Button variant='secondary' onClick={handleMarkAsPaid} disabled={isMarkingPaid}>
                  {isMarkingPaid ? 'Marking...' : 'Mark as Paid'}
                </Button>
              )}
              {sale.isAutoDetected && isPendingDecision ? (
                <>
                  <Button variant='outline' onClick={() => setIsEditing(true)}>
                    Edit First
                  </Button>
                  <Button variant='outline' onClick={handleReject} disabled={isRejecting}>
                    {isRejecting ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button variant='destructive' onClick={handleDelete} disabled={isDeleting} className='gap-2'>
                    <Trash2 className='h-4 w-4' />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button onClick={handleApprove} disabled={isApproving} className='gap-2'>
                    <CheckCircle2 className='h-4 w-4' />
                    {isApproving ? 'Approving...' : 'Approve Sale'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant='outline' onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button variant='destructive' onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button variant='outline' onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={alertConfig.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                alertConfig.action();
              }}
            >
              {alertConfig.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default SalesDetailModal;
