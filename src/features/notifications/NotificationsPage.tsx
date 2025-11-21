import React, { useEffect, useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Info, AlertTriangle, XCircle, CheckCheck, Bell, Search, Filter } from 'lucide-react';
import { notificationApi, Notification, NotificationType } from '../../api/notifications';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL');

  const fetchNotifications = async (pageNum: number, append = false) => {
    try {
      setLoading(true);
      const data = await notificationApi.list(pageNum, 20);
      
      // Safely handle the response
      const notificationsList = data?.notifications || [];
      const paginationData = data?.pagination || { page: pageNum, limit: 20, total: 0, totalPages: 1 };
      
      if (append) {
        setNotifications((prev) => [...prev, ...notificationsList]);
      } else {
        setNotifications(notificationsList);
      }
      setHasMore(paginationData.page < paginationData.totalPages);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      // Set empty state on error
      if (!append) {
        setNotifications([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ERROR':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'ALL' || notification.type === typeFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'READ' && notification.isRead) ||
        (statusFilter === 'UNREAD' && !notification.isRead);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchQuery, typeFilter, statusFilter]);

  // Stats
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const successCount = notifications.filter((n) => n.type === 'SUCCESS').length;
  const errorCount = notifications.filter((n) => n.type === 'ERROR').length;

  const typeFilters = [
    { value: 'ALL' as const, label: 'All Types' },
    { value: 'INFO' as const, label: 'Info' },
    { value: 'SUCCESS' as const, label: 'Success' },
    { value: 'WARNING' as const, label: 'Warning' },
    { value: 'ERROR' as const, label: 'Error' },
  ];

  const statusFilters = [
    { value: 'ALL' as const, label: 'All' },
    { value: 'UNREAD' as const, label: 'Unread' },
    { value: 'READ' as const, label: 'Read' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Stay updated with all your activity</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as NotificationType | 'ALL')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent align="end">
            {typeFilters.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as 'ALL' | 'READ' | 'UNREAD')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent align="end">
            {statusFilters.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading && notifications.length === 0 ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={`notification-stat-skeleton-${index}`} className="h-full">
              <CardHeader className="pb-2 space-y-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNotifications}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unreadCount}</div>
                <p className="text-xs text-muted-foreground">Needs your attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{successCount}</div>
                <p className="text-xs text-muted-foreground">Completed actions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{errorCount}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {loading && notifications.length === 0 ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              `Notifications (${filteredNotifications.length})`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[150px]">Time</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && notifications.length === 0 ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`notification-row-skel-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Bell className="h-8 w-8 opacity-20" />
                      <p>No notifications match your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={`${!notification.isRead ? 'bg-muted/30' : ''} hover:bg-muted/50`}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {notification.isRead ? (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(notification.type)}>
                        <div className="flex items-center gap-1">
                          {getIcon(notification.type)}
                          <span className="capitalize text-xs">{notification.type.toLowerCase()}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark read
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {hasMore && !loading && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
