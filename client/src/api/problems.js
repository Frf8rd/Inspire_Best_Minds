import { api } from "./client.js";

export const problemsApi = {
  getProblems: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return api.get(`/problems${queryString ? `?${queryString}` : ""}`);
  },

  getMyProblems: () => api.get("/me/problems"),

  getProblem: (id) => api.get(`/problems/${id}`),

  createProblem: (formData) => api.post("/problems", formData),

  updateProblem: (id, data) => api.put(`/problems/${id}`, data),

  deleteProblem: (id) => api.delete(`/problems/${id}`),

  getHistory: (id) => api.get(`/problems/${id}/history`),

  updateStatus: (id, { toStatus, comment, assigneeId }) =>
    api.patch(`/problems/${id}/status`, { toStatus, comment, assigneeId }),

  toggleSupport: (id) => api.post(`/problems/${id}/support`),

  confirmResolution: (id, { confirmed, comment }) =>
    api.post(`/problems/${id}/confirm-resolution`, { confirmed, comment }),

  getComments: (id) => api.get(`/problems/${id}/comments`),

  addComment: (id, { content, type = "PUBLIC" }) =>
    api.post(`/problems/${id}/comments`, { content, type }),

  deleteComment: (reportId, commentId) =>
    api.delete(`/problems/${reportId}/comments/${commentId}`),
};
