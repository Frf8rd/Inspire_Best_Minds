import { api } from "./client.js";

export const analyticsApi = {
  getDashboardStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/analytics/dashboard${query ? `?${query}` : ""}`);
  },
  getRecurringZones: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/analytics/recurring-zones${query ? `?${query}` : ""}`);
  },
  getTransparencyReport: (idOrSlug) =>
    api.get(`/analytics/transparency/${idOrSlug}`),
};
