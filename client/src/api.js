const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const api = {
  register: (details) =>
    request("/api/register", { method: "POST", body: details }),
  login: (details) => request("/api/login", { method: "POST", body: details }),
  listTickets: (token) => request("/api/tickets", { token }),
  createTicket: (token, details) =>
    request("/api/tickets", { method: "POST", token, body: details }),
  getTicket: (token, id) => request(`/api/tickets/${id}`, { token }),
  updateTicket: (token, id, status) =>
    request(`/api/tickets/${id}`, {
      method: "PATCH",
      token,
      body: { status },
    }),
  createComment: (token, id, text) =>
    request(`/api/tickets/${id}/comments`, {
      method: "POST",
      token,
      body: { text },
    }),
};
