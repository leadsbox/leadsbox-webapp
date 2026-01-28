import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '@/api/invoices';
import { notificationApi } from '@/api/notifications';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, FileText, User, DollarSign, Calendar, TrendingUp, Trash2, Edit, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface InvoiceReviewModalProps {
  invoiceCode: string;
  notificationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceReviewModal = ({ invoiceCode, notificationId, open, onOpenChange }: InvoiceReviewModalProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch invoice details
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceCode],
    queryFn: () => invoiceApi.getByCode(invoiceCode),
    enabled: open && !!invoiceCode,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      await invoiceApi.update(invoiceCode, { status: 'PENDING_CONFIRMATION' });
      if (notificationId) {
        await notificationApi.markAsRead(notificationId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`Invoice ${invoiceCode} approved and ready to send`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to approve invoice');
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      await invoiceApi.update(invoiceCode, { status: 'VOID' });
      if (notificationId) {
        await notificationApi.markAsRead(notificationId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`Invoice ${invoiceCode} deleted`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to delete invoice');
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleEdit = () => {
    navigate(`/dashboard/invoices/${invoiceCode}`);
    onOpenChange(false);
  };

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this draft invoice?')) {
      deleteMutation.mutate();
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    const pct = (confidence * 100).toFixed(0);
    if (confidence >= 0.85) {
      return (
        <Badge variant='default' className='bg-green-600'>
          High Confidence ({pct}%)
        </Badge>
      );
    } else if (confidence >= 0.7) {
      return (
        <Badge variant='default' className='bg-amber-500'>
          Medium Confidence ({pct}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant='default' className='bg-orange-600'>
          Review Carefully ({pct}%)
        </Badge>
      );
    }
  };

  const invoiceData = invoice?.data;
  const metadata = invoiceData?.metadata as Record<string, unknown> | undefined;
  const confidence = metadata?.confidence as number | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Review Draft Invoice
          </DialogTitle>
          <DialogDescription>This invoice was automatically generated from a conversation. Review the details before approving.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : !invoiceData ? (
          <div className='text-center py-8 text-muted-foreground'>Invoice not found</div>
        ) : (
          <div className='space-y-4'>
            {/* Header Info */}
            <div className='flex items-start justify-between p-4 bg-muted rounded-lg'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-lg font-semibold'>{invoiceData.code}</h3>
                  <Badge variant='outline'>{invoiceData.status}</Badge>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Calendar className='h-4 w-4' />
                  Generated {formatDistanceToNow(new Date(invoiceData.createdAt), { addSuffix: true })}
                </div>
              </div>
              {confidence && (
                <div className='text-right'>
                  <div className='flex items-center gap-1 text-sm text-muted-foreground mb-1'>
                    <TrendingUp className='h-4 w-4' />
                    AI Confidence
                  </div>
                  {getConfidenceBadge(confidence)}
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className='p-4 border rounded-lg'>
              <div className='flex items-center gap-2 mb-2 text-sm font-medium'>
                <User className='h-4 w-4' />
                Customer Information
              </div>
              <div className='text-sm text-muted-foreground'>{invoiceData.contactPhone || 'No phone number'}</div>
            </div>

            {/* Items */}
            <div className='border rounded-lg overflow-hidden'>
              <div className='p-4 bg-muted font-medium text-sm'>Items</div>
              <div className='divide-y'>
                {Array.isArray(invoiceData.items) && invoiceData.items.length > 0 ? (
                  invoiceData.items.map((item: unknown, index: number) => {
                    const typedItem = item as { name: string; quantity: number; unit_price?: number; line_total?: number; currency?: string };
                    return (
                      <div key={index} className='p-4 flex justify-between items-start'>
                        <div>
                          <div className='font-medium'>{typedItem.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            Quantity: {typedItem.quantity}
                            {typedItem.unit_price && ` × ${typedItem.currency ?? invoiceData.currency} ${typedItem.unit_price.toLocaleString()}`}
                          </div>
                        </div>
                        <div className='font-medium'>
                          {typedItem.currency ?? invoiceData.currency}{' '}
                          {(typedItem.line_total ?? (typedItem.unit_price ?? 0) * typedItem.quantity).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className='p-4 text-center text-sm text-muted-foreground'>No items</div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className='p-4 border rounded-lg bg-muted/30'>
              <div className='flex justify-between items-center mb-2 text-sm'>
                <span className='text-muted-foreground'>Subtotal</span>
                <span>
                  {invoiceData.currency} {invoiceData.subtotal?.toLocaleString() ?? '0'}
                </span>
              </div>
              <div className='flex justify-between items-center text-lg font-bold'>
                <div className='flex items-center gap-2'>
                  <DollarSign className='h-5 w-5' />
                  Total
                </div>
                <span>
                  {invoiceData.currency} {invoiceData.total?.toLocaleString() ?? '0'}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className='flex gap-2'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Close
          </Button>
          <Button type='button' variant='destructive' onClick={handleDelete} disabled={isProcessing || !invoiceData}>
            {isProcessing ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Trash2 className='h-4 w-4 mr-2' />}
            Delete
          </Button>
          <Button type='button' variant='secondary' onClick={handleEdit} disabled={isProcessing || !invoiceData}>
            <Edit className='h-4 w-4 mr-2' />
            Edit
          </Button>
          <Button type='button' onClick={handleApprove} disabled={isProcessing || !invoiceData}>
            {isProcessing ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Check className='h-4 w-4 mr-2' />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceReviewModal;
