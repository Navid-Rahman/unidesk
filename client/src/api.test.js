import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./api";

describe("api", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1 }),
    });
  });

  test("sends authentication requests", async () => {
    await api.register({ name: "User", email: "u@example.com", password: "pw" });
    await api.login({ email: "u@example.com", password: "pw" });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("sends authenticated ticket and comment requests", async () => {
    await api.listTickets("token");
    await api.createTicket("token", { title: "Issue", description: "Details" });
    await api.getTicket("token", 1);
    await api.updateTicket("token", 1, "closed");
    await api.createComment("token", 1, "Fixed");

    for (const call of fetch.mock.calls) {
      expect(call[1].headers.Authorization).toBe("Bearer token");
    }
    expect(fetch.mock.calls.map(([path]) => path)).toEqual([
      "/api/tickets",
      "/api/tickets",
      "/api/tickets/1",
      "/api/tickets/1",
      "/api/tickets/1/comments",
    ]);
  });

  test("throws the API error message", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "Invalid credentials" }),
    });

    await expect(api.login({ email: "bad", password: "bad" })).rejects.toThrow(
      "Invalid credentials",
    );
  });

  test("uses a fallback error message", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    });

    await expect(api.listTickets("token")).rejects.toThrow("Request failed");
  });
});
