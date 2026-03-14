import api from './config';

export const notificationService = {
  // Get notifications
  getNotifications: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/notifications?${params}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Clear all notifications
  clearAll: async () => {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  }
};

export default notificationService;
