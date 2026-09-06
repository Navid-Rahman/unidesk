jest.mock("./db", () => ({ query: jest.fn() }));

const request = require("supertest");
const db = require("./db");
const app = require("./server");

describe("UniDesk API integration", () => {
  let users;
  let tickets;
  let comments;

  beforeEach(() => {
    process.env.JWT_SECRET = "integration-secret";
    users = [];
    tickets = [];
    comments = [];
    jest.clearAllMocks();

    db.query.mockImplementation(async (query, values = []) => {
      const sql = query.replace(/\s+/g, " ").trim();

      if (sql === "SELECT id FROM users WHERE email = $1") {
        const user = users.find((item) => item.email === values[0]);
        return { rows: user ? [{ id: user.id }] : [] };
      }

      if (sql.startsWith("INSERT INTO users")) {
        const user = {
          id: users.length + 1,
          name: values[0],
          email: values[1],
          password: values[2],
        };
        users.push(user);
        return {
          rows: [{ id: user.id, name: user.name, email: user.email }],
        };
      }

      if (
        sql === "SELECT id, name, email, password FROM users WHERE email = $1"
      ) {
        const user = users.find((item) => item.email === values[0]);
        return { rows: user ? [user] : [] };
      }

      if (sql === "SELECT * FROM tickets ORDER BY created_at DESC") {
        return {
          rows: [...tickets].sort((a, b) =>
            b.created_at.localeCompare(a.created_at),
          ),
        };
      }

      if (sql.startsWith("INSERT INTO tickets")) {
        const ticket = {
          id: tickets.length + 1,
          title: values[0],
          description: values[1],
          status: values[2],
          user_id: values[3],
          created_at: new Date().toISOString(),
        };
        tickets.push(ticket);
        return { rows: [ticket] };
      }

      if (sql === "SELECT * FROM tickets WHERE id = $1") {
        const ticket = tickets.find((item) => item.id === Number(values[0]));
        return { rows: ticket ? [ticket] : [] };
      }

      if (sql.startsWith("SELECT * FROM comments")) {
        return {
          rows: comments
            .filter((item) => item.ticket_id === Number(values[0]))
            .sort((a, b) => a.created_at.localeCompare(b.created_at)),
        };
      }

      if (sql.startsWith("UPDATE tickets")) {
        const ticket = tickets.find((item) => item.id === Number(values[1]));
        if (!ticket) return { rows: [] };
        ticket.status = values[0];
        return { rows: [ticket] };
      }

      if (sql === "SELECT id FROM tickets WHERE id = $1") {
        const ticket = tickets.find((item) => item.id === Number(values[0]));
        return { rows: ticket ? [{ id: ticket.id }] : [] };
      }

      if (sql.startsWith("INSERT INTO comments")) {
        const comment = {
          id: comments.length + 1,
          ticket_id: Number(values[0]),
          user_id: values[1],
          text: values[2],
          created_at: new Date().toISOString(),
        };
        comments.push(comment);
        return { rows: [comment] };
      }

      throw new Error(`Unexpected query in integration test: ${sql}`);
    });
  });

  async function registerUser() {
    return request(app).post("/api/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password",
    });
  }

  test("completes register, login, ticket, and comment happy paths", async () => {
    const registration = await registerUser();
    expect(registration.status).toBe(201);
    expect(registration.body.user).toEqual({
      id: 1,
      name: "Test User",
      email: "test@example.com",
    });
    expect(registration.body.token).toEqual(expect.any(String));

    const login = await request(app).post("/api/login").send({
      email: "test@example.com",
      password: "password",
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
    const authorization = `Bearer ${login.body.token}`;

    const createdTicket = await request(app)
      .post("/api/tickets")
      .set("Authorization", authorization)
      .send({ title: "Printer issue", description: "It is offline" });
    expect(createdTicket.status).toBe(201);
    expect(createdTicket.body).toMatchObject({
      id: 1,
      title: "Printer issue",
      description: "It is offline",
      status: "open",
      user_id: 1,
    });

    const ticketList = await request(app)
      .get("/api/tickets")
      .set("Authorization", authorization);
    expect(ticketList.status).toBe(200);
    expect(ticketList.body).toHaveLength(1);

    const createdComment = await request(app)
      .post("/api/tickets/1/comments")
      .set("Authorization", authorization)
      .send({ text: "Restarted the printer" });
    expect(createdComment.status).toBe(201);
    expect(createdComment.body).toMatchObject({
      ticket_id: 1,
      user_id: 1,
      text: "Restarted the printer",
    });

    const ticketDetail = await request(app)
      .get("/api/tickets/1")
      .set("Authorization", authorization);
    expect(ticketDetail.status).toBe(200);
    expect(ticketDetail.body.comments).toHaveLength(1);

    const updatedTicket = await request(app)
      .patch("/api/tickets/1")
      .set("Authorization", authorization)
      .send({ status: "closed" });
    expect(updatedTicket.status).toBe(200);
    expect(updatedTicket.body.status).toBe("closed");
  });

  test("rejects invalid login credentials", async () => {
    await registerUser();

    const unknownUser = await request(app).post("/api/login").send({
      email: "missing@example.com",
      password: "password",
    });
    const wrongPassword = await request(app).post("/api/login").send({
      email: "test@example.com",
      password: "wrong-password",
    });

    expect(unknownUser.status).toBe(401);
    expect(unknownUser.body).toEqual({ error: "Invalid credentials" });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toEqual({ error: "Invalid credentials" });
  });

  test.each([
    ["post", "/api/register", { name: "Test User", email: "test@example.com" }],
    ["post", "/api/login", { email: "test@example.com" }],
  ])("%s %s returns 400 for missing fields", async (method, path, body) => {
    const response = await request(app)[method](path).send(body);

    expect(response.status).toBe(400);
  });

  test("rejects missing ticket and comment fields", async () => {
    const registration = await registerUser();
    const authorization = `Bearer ${registration.body.token}`;

    const ticket = await request(app)
      .post("/api/tickets")
      .set("Authorization", authorization)
      .send({ title: "Missing description" });
    const status = await request(app)
      .patch("/api/tickets/1")
      .set("Authorization", authorization)
      .send({});
    const comment = await request(app)
      .post("/api/tickets/1/comments")
      .set("Authorization", authorization)
      .send({});

    expect(ticket.status).toBe(400);
    expect(status.status).toBe(400);
    expect(comment.status).toBe(400);
  });

  test("rejects a bad token", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Invalid token" });
  });

  test("returns 404 for every ticket-not-found scenario", async () => {
    const registration = await registerUser();
    const authorization = `Bearer ${registration.body.token}`;

    const detail = await request(app)
      .get("/api/tickets/999")
      .set("Authorization", authorization);
    const update = await request(app)
      .patch("/api/tickets/999")
      .set("Authorization", authorization)
      .send({ status: "closed" });
    const comment = await request(app)
      .post("/api/tickets/999/comments")
      .set("Authorization", authorization)
      .send({ text: "Is this fixed?" });

    for (const response of [detail, update, comment]) {
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Ticket not found" });
    }
  });
});
