import { apiClient } from './client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    is_read: boolean;
    created_at: string;
}

export const notificationsAPI = {
    list: () => apiClient.get<Notification[]>('/api/v1/notifications/'),
    read: (id: string) => apiClient.post(`/api/v1/notifications/${id}/read/`),
    readAll: () => apiClient.post('/api/v1/notifications/read-all/'),
    getUnreadCount: () => apiClient.get<{ unread_count: number }>('/api/v1/notifications/unread-count/'),
};
