import client from './client';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export const notificationApi = {
  list: async (page = 1, limit = 20, isRead?: boolean) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (isRead !== undefined) {
      params.append('isRead', isRead.toString());
    }

    const response = await client.get<NotificationListResponse>(
      `/notifications?${params.toString()}`
    );
    // Handle nested response structure (response.data.data)
    const responseData = response.data as unknown as Record<string, unknown>;
    const data = (responseData.data ?? responseData) as Partial<NotificationListResponse>;
    
    return {
      notifications: Array.isArray(data.notifications) ? data.notifications : [],
      pagination: data.pagination ?? {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
      unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
    };
  },

  markAsRead: async (id: string) => {
    const response = await client.patch(
      `/notifications/${id}/read`
    );
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await client.patch(
      `/notifications/read-all`
    );
    return response.data;
  },
};
