import axiosInstance from './axios'
import type { AppNotification, Page, SendNotificationRequest, StockAlert } from '../types'

export const notificationApi = {
  send: (data: SendNotificationRequest) =>
    axiosInstance.post<AppNotification>('/notifications', data).then((r) => r.data),

  getMyNotifications: (params: {
    page?: number
    size?: number
    sortBy?: string
    direction?: string
    unreadOnly?: boolean
  }) =>
    axiosInstance.get<Page<AppNotification>>('/notifications', { params }).then((r) => r.data),

  getUnreadCount: () =>
    axiosInstance.get<number>('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string) =>
    axiosInstance.patch<AppNotification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => axiosInstance.post<void>('/notifications/read-all'),

  delete: (id: string) => axiosInstance.delete<void>(`/notifications/${id}`),

  getStockAlerts: () =>
    axiosInstance.get<StockAlert[]>('/notifications/stock-alerts').then((r) => r.data),

  getStockAlertCount: () =>
    axiosInstance.get<number>('/notifications/stock-alert-count').then((r) => r.data),
}
