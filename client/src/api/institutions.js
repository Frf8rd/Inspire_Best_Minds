import { api } from "./client.js";

export const institutionsApi = {
  getInstitutions: () => api.get("/institutions"),
  getInstitution: (idOrSlug) => api.get(`/institutions/${idOrSlug}`),
  createInstitution: (data) => api.post("/institutions", data),
  updateInstitution: (id, data) => api.put(`/institutions/${id}`, data),

  addDepartment: (institutionId, data) =>
    api.post(`/institutions/${institutionId}/departments`, data),
  deleteDepartment: (institutionId, departmentId) =>
    api.delete(`/institutions/${institutionId}/departments/${departmentId}`),

  addMember: (institutionId, data) =>
    api.post(`/institutions/${institutionId}/members`, data),
  removeMember: (institutionId, userId) =>
    api.delete(`/institutions/${institutionId}/members/${userId}`),

  getRoutingRules: () => api.get("/institutions/routing-rules"),
  createRoutingRule: (data) => api.post("/institutions/routing-rules", data),
  deleteRoutingRule: (id) => api.delete(`/institutions/routing-rules/${id}`),
};
