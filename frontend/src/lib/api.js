// Thin fetch wrapper around the TransitOps Express API.
// Base URL comes from VITE_API_URL (see .env.example) so it can point at
// localhost during dev and a deployed host during the demo without code changes.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const TOKEN_KEY = "transitops_token";
const USER_KEY = "transitops_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Core request helper. Throws an ApiError with `.status` and `.message`
 * (pulled from the backend's { message } body) so callers can show the
 * exact validation/business-rule text the API returns.
 */
async function request(path, { method = "GET", body, params, auth = true } = {}) {
  let url = `${BASE_URL}${path}`;

  if (params) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    if (query) url += `?${query}`;
  }

  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error(
      "Could not reach the TransitOps API. Is the backend running on " + BASE_URL + "?"
    );
    err.status = 0;
    throw err;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body, opts = {}) => request(path, { method: "POST", body, ...opts }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

// ---- Grouped endpoint helpers (mirrors the README's route list) ----

export const authApi = {
  login: (email, password) =>
    api.post("/auth/login", { email, password }, { auth: false }),
  register: (payload) => api.post("/auth/register", payload, { auth: false }),
  forgotPassword: (email) =>
    api.post("/auth/forgot-password", { email }, { auth: false }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }, { auth: false }),
};

export const dashboardApi = {
  get: (filters) => api.get("/dashboard", filters),
};

export const vehicleApi = {
  list: (filters) => api.get("/vehicles", filters),
  dispatchable: () => api.get("/vehicles/dispatchable"),
  create: (payload) => api.post("/vehicles", payload),
  update: (id, payload) => api.put(`/vehicles/${id}`, payload),
  retire: (id) => api.patch(`/vehicles/${id}/retire`),
  costSummary: (id) => api.get(`/vehicles/${id}/cost-summary`),
  remove: (id) => api.del(`/vehicles/${id}`),
};

export const driverApi = {
  list: (filters) => api.get("/drivers", filters),
  dispatchable: () => api.get("/drivers/dispatchable"),
  create: (payload) => api.post("/drivers", payload),
  update: (id, payload) => api.put(`/drivers/${id}`, payload),
  suspend: (id) => api.patch(`/drivers/${id}/suspend`),
  remove: (id) => api.del(`/drivers/${id}`),
};

export const tripApi = {
  list: (filters) => api.get("/trips", filters),
  create: (payload) => api.post("/trips", payload),
  dispatch: (id) => api.patch(`/trips/${id}/dispatch`),
  complete: (id, payload) => api.patch(`/trips/${id}/complete`, payload),
  cancel: (id) => api.patch(`/trips/${id}/cancel`),
};

export const maintenanceApi = {
  list: (filters) => api.get("/maintenance", filters),
  create: (payload) => api.post("/maintenance", payload),
  close: (id) => api.patch(`/maintenance/${id}/close`),
};

export const fuelApi = {
  list: (vehicle_id) => api.get("/fuel", { vehicle_id }),
  create: (payload) => api.post("/fuel", payload),
};

export const expenseApi = {
  list: (vehicle_id) => api.get("/expenses", { vehicle_id }),
  create: (payload) => api.post("/expenses", payload),
};

export const reportsApi = {
  fleet: () => api.get("/reports/fleet"),
  utilization: () => api.get("/reports/utilization"),
  exportCsvUrl: () => `${BASE_URL}/reports/fleet/export`,
};
