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

  getMyProblems: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return api.get(`/me/problems${queryString ? `?${queryString}` : ""}`);
  },

  // Backendul întoarce { problem }; paginile lucrează direct cu obiectul sesizării.
  getProblem: (id) => api.get(`/problems/${id}`).then((res) => res.problem),

  createProblem: (formData) => api.post("/problems", formData),

  updateProblem: (id, data) =>
    api.put(`/problems/${id}`, data).then((res) => res.problem),

  deleteProblem: (id) => api.delete(`/problems/${id}`),

  // Backendul întoarce { history: [...] }.
  getHistory: (id) => api.get(`/problems/${id}/history`).then((res) => res.history || []),

  // Backendul citește req.body.status (nu toStatus) și întoarce { message, problem }.
  updateStatus: (id, { toStatus, comment, assigneeId }) =>
    api
      .patch(`/problems/${id}/status`, { status: toStatus, comment, assigneeId })
      .then((res) => res.problem),

  toggleSupport: (id) => api.post(`/problems/${id}/support`),

  confirmResolution: (id, { confirmed, comment }) =>
    api
      .post(`/problems/${id}/confirm-resolution`, { confirmed, comment })
      .then((res) => res.problem),

  getComments: (id) => api.get(`/problems/${id}/comments`),

  // Backendul așteaptă { body, visibility } și întoarce { message, comment }.
  addComment: (id, { body, visibility = "PUBLIC" }) =>
    api.post(`/problems/${id}/comments`, { body, visibility }).then((res) => res.comment),

  deleteComment: (reportId, commentId) =>
    api.delete(`/problems/${reportId}/comments/${commentId}`),
};
