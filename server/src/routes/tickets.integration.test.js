jest.mock("../db", () => ({ query: jest.fn() }));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const db = require("../db");
const ticketsRouter = require("./tickets");

describe("ticket and comment routes", () => {
  const app = express();
  app.use(express.json());
  app.use(ticketsRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "integration-secret";
  });

  function authorization() {
    const token = jwt.sign(
      { id: 4, email: "user@example.com" },
      process.env.JWT_SECRET,
    );
    return `Bearer ${token}`;
  }

  test.each([
    ["get", "/api/tickets"],
    ["post", "/api/tickets"],
    ["get", "/api/tickets/1"],
    ["patch", "/api/tickets/1"],
    ["post", "/api/tickets/1/comments"],
  ])("%s %s requires authentication", async (method, path) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Token required" });
    expect(db.query).not.toHaveBeenCalled();
  });

  test("GET /api/tickets returns all tickets", async () => {
    const tickets = [{ id: 1, title: "Printer issue", status: "open" }];
    db.query.mockResolvedValue({ rows: tickets });

    const response = await request(app)
      .get("/api/tickets")
      .set("Authorization", authorization());

    expect(response.status).toBe(200);
    expect(response.body).toEqual(tickets);
  });

  test("POST /api/tickets creates an open ticket", async () => {
    const ticket = {
      id: 1,
      title: "Printer issue",
      description: "It is offline",
      status: "open",
      user_id: 4,
    };
    db.query.mockResolvedValue({ rows: [ticket] });

    const response = await request(app)
      .post("/api/tickets")
      .set("Authorization", authorization())
      .send({ title: "Printer issue", description: "It is offline" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(ticket);
    expect(db.query.mock.calls[0][1]).toEqual([
      "Printer issue",
      "It is offline",
      "open",
      4,
    ]);
  });

  test("GET /api/tickets/:id returns a ticket with comments", async () => {
    const ticket = { id: 1, title: "Printer issue" };
    const comments = [{ id: 2, text: "Fixed" }];
    db.query
      .mockResolvedValueOnce({ rows: [ticket] })
      .mockResolvedValueOnce({ rows: comments });

    const response = await request(app)
      .get("/api/tickets/1")
      .set("Authorization", authorization());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...ticket, comments });
  });

  test("PATCH /api/tickets/:id updates its status", async () => {
    const ticket = { id: 1, status: "closed" };
    db.query.mockResolvedValue({ rows: [ticket] });

    const response = await request(app)
      .patch("/api/tickets/1")
      .set("Authorization", authorization())
      .send({ status: "closed" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(ticket);
    expect(db.query.mock.calls[0][1]).toEqual(["closed", "1"]);
  });

  test("PATCH /api/tickets/:id rejects an invalid status", async () => {
    const response = await request(app)
      .patch("/api/tickets/1")
      .set("Authorization", authorization())
      .send({ status: "pending" });

    expect(response.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test("POST /api/tickets/:id/comments creates a comment", async () => {
    const comment = { id: 2, ticket_id: 1, user_id: 4, text: "Fixed" };
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [comment] });

    const response = await request(app)
      .post("/api/tickets/1/comments")
      .set("Authorization", authorization())
      .send({ text: "Fixed" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(comment);
    expect(db.query.mock.calls[1][1]).toEqual(["1", 4, "Fixed"]);
  });
});
