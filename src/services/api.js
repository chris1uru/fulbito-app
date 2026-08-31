const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
const API_URL = configuredApiUrl ?? (__DEV__ ? "http://localhost:8080" : "");
if (!__DEV__ && !API_URL.startsWith("https://")) {
  throw new Error(
    "La compilación de producción requiere EXPO_PUBLIC_API_URL con HTTPS.",
  );
}
const REQUEST_TIMEOUT_MS = 15_000;

let token = null;
let unauthorizedHandler = null;

export const setApiToken = (value) => {
  token = value;
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

async function request(path, { body, ...options } = {}) {
  const controller = new AbortController();
  const requestToken = token;
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "La solicitud tardó demasiado. Revisá tu conexión e intentá nuevamente.",
      );
    }

    throw new Error(
      "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá nuevamente.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (response.status === 401 && requestToken) {
    token = null;
    await unauthorizedHandler?.();
    throw new Error("Tu sesión venció. Iniciá sesión nuevamente.");
  }

  if (!response.ok)
    throw new Error(
      Object.values(data?.fieldErrors ?? {}).join("\n") ||
        data?.message ||
        "No se pudo completar la solicitud",
    );
  return data;
}

export const authApi = {
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  registerPlayer: (body) =>
    request("/api/auth/register-player", { method: "POST", body }),
  me: () => request("/api/users/me"),
  updateMe: (body) => request("/api/users/me", { method: "PUT", body }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  deleteMe: () => request("/api/users/me", { method: "DELETE" }),
  changePassword: (body) =>
    request("/api/users/me/password", { method: "PUT", body }),
};

export const venuesApi = {
  publicList: () => request("/api/public/venues"),
  publicOne: (id) => request(`/api/public/venues/${id}`),
  availabilityHour: (date, time) =>
    request(
      `/api/public/venues/availability?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&windowMinutes=60`,
    ),
  mine: () => request("/api/owner/venues"),
  update: (id, body) =>
    request(`/api/owner/venues/${id}`, { method: "PUT", body }),
  adminList: () => request("/api/admin/venues"),
  adminOne: (id) => request(`/api/admin/venues/${id}`),
  adminCreate: (body) => request("/api/admin/venues", { method: "POST", body }),
  adminUpdate: (id, body) =>
    request(`/api/admin/venues/${id}`, { method: "PUT", body }),
  adminSetStatus: (id, status) =>
    request(`/api/admin/venues/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
};

export const adminUsersApi = {
  search: (query = "", role = "OWNER") =>
    request(
      `/api/admin/users?query=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}`,
    ),
  create: (body) => request("/api/admin/users", { method: "POST", body }),
  setStatus: (id, status) =>
    request(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
};

export const courtsApi = {
  list: (venueId) => request(`/api/public/venues/${venueId}/courts`),
  managedList: (venueId) => request(`/api/owner/venues/${venueId}/courts`),
  availability: (id, date) =>
    request(
      `/api/public/courts/${id}/availability?date=${encodeURIComponent(date)}`,
    ),
  create: (venueId, body) =>
    request(`/api/owner/venues/${venueId}/courts`, { method: "POST", body }),
  update: (id, body) =>
    request(`/api/owner/courts/${id}`, { method: "PUT", body }),
};

export const scheduleApi = {
  hours: (venueId) => request(`/api/public/venues/${venueId}/opening-hours`),
  addHour: (venueId, body) =>
    request(`/api/owner/venues/${venueId}/opening-hours`, {
      method: "POST",
      body,
    }),
  deleteHour: (id) =>
    request(`/api/owner/opening-hours/${id}`, { method: "DELETE" }),
  blocks: (courtId, from, to) =>
    request(
      `/api/owner/courts/${courtId}/blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  addBlock: (courtId, body) =>
    request(`/api/owner/courts/${courtId}/blocks`, { method: "POST", body }),
  deleteBlock: (id) => request(`/api/owner/blocks/${id}`, { method: "DELETE" }),
};

export const reservationsApi = {
  create: (body) => request("/api/reservations", { method: "POST", body }),
  one: (id) => request(`/api/reservations/${id}`),
  mine: () => request("/api/reservations/mine"),
  ownerAgenda: (from, to, venueId) =>
    request(
      `/api/reservations/owner-agenda?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${venueId ? `&venueId=${encodeURIComponent(venueId)}` : ""}`,
    ),
  markPaid: (id) =>
    request(`/api/reservations/${id}/mark-paid`, { method: "PATCH" }),
  cancelOwner: (id) =>
    request(`/api/reservations/${id}/cancel-owner`, { method: "PATCH" }),
  cancelPlayer: (id) =>
    request(`/api/reservations/${id}/cancel-player`, { method: "PATCH" }),
};

export const matchRequestsApi = {
  discover: ({ style, format, from, to } = {}) => {
    const params = new URLSearchParams();
    if (style && style !== "ALL") params.set("style", style);
    if (format && format !== "ALL") params.set("format", format);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    return request(`/api/match-requests${query ? `?${query}` : ""}`);
  },
  mine: () => request("/api/match-requests/mine"),
  create: (body) => request("/api/match-requests", { method: "POST", body }),
  close: (id) =>
    request(`/api/match-requests/${id}/close`, { method: "PATCH" }),
  expressInterest: (id) =>
    request(`/api/match-requests/${id}/interests`, { method: "POST" }),
  interests: (id) => request(`/api/match-requests/${id}/interests`),
};

export const departmentsApi = { list: () => request("/api/departments") };

export const imagesApi = {
  venueList: (id) => request(`/api/public/venues/${id}/images`),
  courtList: (id) => request(`/api/public/courts/${id}/images`),
  prepareVenue: (id) =>
    request(`/api/owner/venues/${id}/images/upload-signature`, {
      method: "POST",
    }),
  prepareCourt: (id) =>
    request(`/api/owner/courts/${id}/images/upload-signature`, {
      method: "POST",
    }),
  addVenue: (id, body) =>
    request(`/api/owner/venues/${id}/images`, { method: "POST", body }),
  addCourt: (id, body) =>
    request(`/api/owner/courts/${id}/images`, { method: "POST", body }),
  setVenueCover: (id) =>
    request(`/api/owner/venue-images/${id}/cover`, { method: "PATCH" }),
  deleteVenue: (id) =>
    request(`/api/owner/venue-images/${id}`, { method: "DELETE" }),
  deleteCourt: (id) =>
    request(`/api/owner/court-images/${id}`, { method: "DELETE" }),
};
