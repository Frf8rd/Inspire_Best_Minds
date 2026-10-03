import { api } from "./client.js";

export const adminApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/admin/users${query ? `?${query}` : ""}`);
  },
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, isActive) =>
    api.patch(`/admin/users/${id}/status`, { isActive }),
};
