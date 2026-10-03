import { api } from "./client.js";

export const notificationsApi = {
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/notifications${query ? `?${query}` : ""}`);
  },
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};
