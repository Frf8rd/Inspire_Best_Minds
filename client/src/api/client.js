// În dev, Vite face proxy pe /api. În producție setează VITE_API_URL sau VITE_API_BASE_URL,
// de exemplu "https://api.exemplu.md/api" (sau lasă gol dacă există un rewrite pe /api).
const BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

// Originea API-ului (fără sufixul /api). Fișierele din /uploads sunt servite de backend.
export const API_ORIGIN = /^https?:\/\//i.test(BASE_URL) ? BASE_URL.replace(/\/api$/, "") : "";

export const API_BASE_URL = BASE_URL;

// Transformă o cale relativă (ex. "/uploads/reports/x.jpg") într-un URL utilizabil în <img>/<a>.
export function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

// Endpoint-uri la care NU se încearcă refresh (ar produce bucle sau n-au sens).
const NO_REFRESH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Cookie-ul de acces expiră (maxAge 15 min) odată cu tokenul, deci după expirare browserul
// nu îl mai trimite și serverul răspunde NO_TOKEN, nu TOKEN_EXPIRED. Reîncercăm la ambele.
const REFRESHABLE_CODES = ["TOKEN_EXPIRED", "NO_TOKEN"];

let refreshPromise = null;

// O singură cerere de refresh la un moment dat; cererile paralele o așteaptă pe aceeași.
// Refresh token-ul se rotește la fiecare folosire, deci două refresh-uri simultane l-ar invalida.
function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function parseBody(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  return {};
}

export async function request(endpoint, options = {}, isRetry = false) {
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
  const data = await parseBody(response);

  if (!response.ok) {
    const canRefresh =
      response.status === 401 &&
      !isRetry &&
      REFRESHABLE_CODES.includes(data.code) &&
      !NO_REFRESH_ENDPOINTS.some((p) => endpoint.startsWith(p));

    if (canRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request(endpoint, options, true);
      }
      // Sesiunea nu mai poate fi reînnoită: anunțăm aplicația să deconecteze userul.
      window.dispatchEvent(new Event("auth:expired"));
    }

    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data.code;
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
