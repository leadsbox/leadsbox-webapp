import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Info, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationApi, Notification } from '../api/notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import InvoiceReviewModal from './InvoiceReviewModal';
import { useSocketIO } from '@/lib/socket';
import { toast } from 'sonner';

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [reviewInvoiceCode, setReviewInvoiceCode] = useState<string | null>(null);
  const [reviewNotificationId, setReviewNotificationId] = useState<string | null>(null);

  const { on: socketOn } = useSocketIO();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.list(1, 10);
      setNotifications(data?.notifications ?? []);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen for new draft invoices via Socket.IO
  useEffect(() => {
    const unsubscribe = socketOn('nlp:small', (data: { invoiceId?: string; invoiceCode?: string }) => {
      // Check if a draft invoice was created
      if (data.invoiceId) {
        // Refresh notifications
        fetchNotifications();

        // Show toast notification
        toast.info('New draft invoice needs review', {
          description: `Invoice ${data.invoiceCode || ''} was automatically generated`,
          action: {
            label: 'Review',
            onClick: () => {
              if (data.invoiceCode) {
                setReviewInvoiceCode(data.invoiceCode);
              }
            },
          },
        });
      }
    });

    return () => unsubscribe();
  }, [socketOn]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleReviewInvoice = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    const metadata = notification.metadata as Record<string, unknown> | undefined;
    const invoiceCode = metadata?.invoiceCode as string | undefined;
    if (invoiceCode) {
      setReviewInvoiceCode(invoiceCode);
      setReviewNotificationId(notification.id);
      setIsOpen(false); // Close dropdown
    }
  };

  const handleReviewModalClose = (open: boolean) => {
    if (!open) {
      setReviewInvoiceCode(null);
      setReviewNotificationId(null);
      fetchNotifications(); // Refresh notifications
    }
  };

  const getIcon = (type: string, metadata?: Record<string, unknown>) => {
    if (metadata?.action === 'review_invoice') {
      return <FileText className='h-4 w-4 text-blue-500' />;
    }
    switch (type) {
      case 'SUCCESS':
        return <Check className='h-4 w-4 text-green-500' />;
      case 'WARNING':
        return <AlertTriangle className='h-4 w-4 text-amber-500' />;
      case 'ERROR':
        return <XCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Info className='h-4 w-4 text-blue-500' />;
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' className='relative'>
            <Bell className='h-5 w-5' />
            {unreadCount > 0 && (
              <Badge variant='destructive' className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0'>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-80'>
          <div className='flex items-center justify-between px-2 py-1.5'>
            <DropdownMenuLabel className='text-base p-0'>Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button variant='ghost' size='sm' className='h-auto px-2 py-1 text-xs text-primary' onClick={handleMarkAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className='max-h-96 overflow-auto'>
            {loading && (!notifications || notifications.length === 0) ? (
              <div className='p-4 text-center text-sm text-muted-foreground'>Loading...</div>
            ) : !notifications || notifications.length === 0 ? (
              <div className='p-8 text-center text-sm text-muted-foreground'>No notifications yet</div>
            ) : (
              notifications.map((notification) => {
                const metadata = notification.metadata as Record<string, unknown> | undefined;
                const isDraftInvoice = metadata?.action === 'review_invoice';

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex-col items-start space-y-1 py-3 cursor-pointer ${!notification.isRead ? 'bg-muted/30' : ''}`}
                  >
                    <div className='flex w-full gap-3'>
                      <div className='mt-1 flex-shrink-0'>{getIcon(notification.type, metadata)}</div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex justify-between items-start'>
                          <span className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </span>
                          <span className='text-xs text-muted-foreground whitespace-nowrap ml-2'>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>{notification.message}</p>
                        <div className='flex gap-2 mt-2'>
                          {isDraftInvoice && (
                            <Button variant='default' size='sm' className='h-7 px-3 text-xs' onClick={(e) => handleReviewInvoice(notification, e)}>
                              Review
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 px-2 text-[10px] text-primary hover:text-primary/80'
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className='text-center justify-center cursor-pointer'>
            <Link to='/dashboard/notifications'>View all notifications</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Invoice Review Modal */}
      {reviewInvoiceCode && (
        <InvoiceReviewModal
          invoiceCode={reviewInvoiceCode}
          notificationId={reviewNotificationId ?? undefined}
          open={!!reviewInvoiceCode}
          onOpenChange={handleReviewModalClose}
        />
      )}
    </>
  );
};

export default NotificationDropdown;
