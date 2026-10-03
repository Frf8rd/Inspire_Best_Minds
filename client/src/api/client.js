const BASE_URL = "/api";

export async function request(endpoint, options = {}) {
  const config = {
    credentials: "include",
    ...options,
    headers: {
      ...options.headers,
    },
  };

  // Automatic JSON Content-Type unless sending FormData
  if (!(options.body instanceof FormData) && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Parse JSON or return empty object for 204
  let data = {};
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (url, options) => request(url, { method: "GET", ...options }),
  post: (url, body, options) =>
    request(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  put: (url, body, options) =>
    request(url, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  patch: (url, body, options) =>
    request(url, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  delete: (url, options) => request(url, { method: "DELETE", ...options }),
};
