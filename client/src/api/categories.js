import { api } from "./client.js";

export const categoriesApi = {
  getCategories: (all = false) => api.get(`/problems/categories${all ? "?all=true" : ""}`),
  createCategory: (data) => api.post("/problems/categories", data),
  updateCategory: (id, data) => api.put(`/problems/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/problems/categories/${id}`),
};
