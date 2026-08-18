const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

let token = null;
export const setApiToken = (value) => {
  token = value;
};

async function request(path, { body, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
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
};

export const venuesApi = {
  publicList: () => request("/api/public/venues"),
  publicOne: (id) => request(`/api/public/venues/${id}`),
  mine: () => request("/api/owner/venues"),
  create: (body) => request("/api/owner/venues", { method: "POST", body }),
  update: (id, body) =>
    request(`/api/owner/venues/${id}`, { method: "PUT", body }),
};

export const courtsApi = {
  list: (venueId) => request(`/api/public/venues/${venueId}/courts`),
  publicOne: (id) => request(`/api/public/courts/${id}`),
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
  blocks: (courtId) => request(`/api/owner/courts/${courtId}/blocks`),
  addBlock: (courtId, body) =>
    request(`/api/owner/courts/${courtId}/blocks`, { method: "POST", body }),
  deleteBlock: (id) => request(`/api/owner/blocks/${id}`, { method: "DELETE" }),
};

export const reservationsApi = {
  create: (body) => request("/api/reservations", { method: "POST", body }),
  mine: () => request("/api/reservations/mine"),
  ownerAgenda: (from, to) =>
    request(
      `/api/reservations/owner-agenda?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  markPaid: (id) =>
    request(`/api/reservations/${id}/mark-paid`, { method: "PATCH" }),
  cancelOwner: (id) =>
    request(`/api/reservations/${id}/cancel-owner`, { method: "PATCH" }),
  cancelPlayer: (id) =>
    request(`/api/reservations/${id}/cancel-player`, { method: "PATCH" }),
};

export const departmentsApi = { list: () => request("/api/departments") };

export const imagesApi = {
  venueList: (id) => request(`/api/public/venues/${id}/images`),
  courtList: (id) => request(`/api/public/courts/${id}/images`),
  addVenue: (id, body) =>
    request(`/api/owner/venues/${id}/images`, { method: "POST", body }),
  addCourt: (id, body) =>
    request(`/api/owner/courts/${id}/images`, { method: "POST", body }),
  deleteVenue: (id) =>
    request(`/api/owner/venue-images/${id}`, { method: "DELETE" }),
  deleteCourt: (id) =>
    request(`/api/owner/court-images/${id}`, { method: "DELETE" }),
};
