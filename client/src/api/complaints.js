import { api } from "./client.js";

export const complaintsApi = {
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/complaints${query ? `?${query}` : ""}`);
  },
  getComplaint: (id) => api.get(`/complaints/${id}`),
  createComplaint: (reportId, data = {}) =>
    api.post(`/problems/${reportId}/complaints`, data),
  acknowledgeComplaint: (id) => api.patch(`/complaints/${id}/acknowledge`),
  answerComplaint: (id, answerText) =>
    api.patch(`/complaints/${id}/answer`, { answerText }),
  checkEscalations: () => api.post("/complaints/check-escalations"),
};
