import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App, { AuthView, TicketDetailView, TicketListView } from "./App";
import { api } from "./api";

vi.mock("./api", () => ({
  api: {
    register: vi.fn(),
    login: vi.fn(),
    listTickets: vi.fn(),
    createTicket: vi.fn(),
    getTicket: vi.fn(),
    updateTicket: vi.fn(),
    createComment: vi.fn(),
  },
}));

describe("UniDesk views", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("logs in and stores the token", async () => {
    api.login.mockResolvedValue({ token: "jwt-token" });
    api.listTickets.mockResolvedValue([]);

    render(<App />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Login" }).at(-1));

    expect(
      await screen.findByRole("heading", { name: "Tickets" }),
    ).toBeVisible();
    expect(localStorage.getItem("token")).toBe("jwt-token");
  });

  test("registers a user", async () => {
    const onAuthenticated = vi.fn();
    api.register.mockResolvedValue({ token: "registered-token" });
    render(<AuthView onAuthenticated={onAuthenticated} />);

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Register" }).at(-1));

    await waitFor(() =>
      expect(onAuthenticated).toHaveBeenCalledWith("registered-token"),
    );
    expect(api.register).toHaveBeenCalledWith({
      name: "Test User",
      email: "user@example.com",
      password: "password",
    });
  });

  test("shows an authentication error", async () => {
    api.login.mockRejectedValue(new Error("Invalid credentials"));
    render(<AuthView onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Login" }).at(-1));

    expect(await screen.findByText("Invalid credentials")).toBeVisible();
  });

  test("lists, creates, and selects tickets", async () => {
    const onSelect = vi.fn();
    const ticket = { id: 1, title: "Printer issue", status: "open" };
    api.listTickets.mockResolvedValue([]);
    api.createTicket.mockResolvedValue(ticket);
    render(
      <TicketListView token="token" onSelect={onSelect} onLogout={vi.fn()} />,
    );

    expect(await screen.findByText("No tickets yet.")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Printer issue" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "It is offline" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));

    fireEvent.click(await screen.findByText("Printer issue"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test("updates a ticket and adds a comment", async () => {
    api.getTicket.mockResolvedValue({
      id: 1,
      title: "Printer issue",
      description: "It is offline",
      status: "open",
      comments: [],
    });
    api.updateTicket.mockResolvedValue({ id: 1, status: "closed" });
    api.createComment.mockResolvedValue({ id: 1, text: "Restarted it" });
    render(<TicketDetailView token="token" ticketId={1} onBack={vi.fn()} />);

    expect(await screen.findByText("No comments yet.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Mark as closed" }));
    expect(await screen.findByText("Status: closed")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Add comment"), {
      target: { value: "Restarted it" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    expect(await screen.findByText("Restarted it")).toBeVisible();
    expect(api.createComment).toHaveBeenCalledWith("token", 1, "Restarted it");
  });

  test("logs out from the ticket list", async () => {
    localStorage.setItem("token", "jwt-token");
    api.listTickets.mockResolvedValue([]);
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Logout" }));

    expect(screen.getByRole("heading", { name: "UniDesk" })).toBeVisible();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
