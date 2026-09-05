jest.mock("../db", () => ({ query: jest.fn() }));

const db = require("../db");
const ticketsRouter = require("./tickets");

const {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  createComment,
} = ticketsRouter;

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("ticket route handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("listTickets returns tickets in the database result", async () => {
    const tickets = [{ id: 1, title: "Printer issue" }];
    db.query.mockResolvedValue({ rows: tickets });
    const res = createResponse();

    await listTickets({}, res, jest.fn());

    expect(db.query).toHaveBeenCalledWith(
      "SELECT * FROM tickets ORDER BY created_at DESC",
      [],
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(tickets);
  });

  test("listTickets returns an empty array when there are no tickets", async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = createResponse();

    await listTickets({}, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("createTicket rejects missing fields", async () => {
    const res = createResponse();

    await createTicket(
      { body: { title: "Printer issue" }, user: { id: 4 } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test("createTicket inserts an open ticket for the authenticated user", async () => {
    const ticket = {
      id: 1,
      title: "Printer issue",
      description: "It is offline",
      status: "open",
      user_id: 4,
    };
    db.query.mockResolvedValue({ rows: [ticket] });
    const res = createResponse();

    await createTicket(
      {
        body: { title: "Printer issue", description: "It is offline" },
        user: { id: 4 },
      },
      res,
      jest.fn(),
    );

    expect(db.query.mock.calls[0][1]).toEqual([
      "Printer issue",
      "It is offline",
      "open",
      4,
    ]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(ticket);
  });

  test("getTicket returns 404 without querying comments when absent", async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = createResponse();

    await getTicket({ params: { id: "99" } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Ticket not found" });
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("getTicket returns the ticket with ordered comments", async () => {
    const ticket = { id: 1, title: "Printer issue" };
    const comments = [{ id: 2, ticket_id: 1, text: "Fixed" }];
    db.query
      .mockResolvedValueOnce({ rows: [ticket] })
      .mockResolvedValueOnce({ rows: comments });
    const res = createResponse();

    await getTicket({ params: { id: "1" } }, res, jest.fn());

    expect(db.query.mock.calls[0]).toEqual([
      "SELECT * FROM tickets WHERE id = $1",
      ["1"],
    ]);
    expect(db.query.mock.calls[1][0]).toContain("ORDER BY created_at ASC");
    expect(db.query.mock.calls[1][1]).toEqual(["1"]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ...ticket, comments });
  });

  test("updateTicket rejects a missing or unsupported status", async () => {
    const res = createResponse();

    await updateTicket(
      { body: { status: "pending" }, params: { id: "1" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test("updateTicket returns 404 when the ticket is absent", async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = createResponse();

    await updateTicket(
      { body: { status: "closed" }, params: { id: "99" } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Ticket not found" });
  });

  test("updateTicket updates and returns the ticket", async () => {
    const ticket = { id: 1, status: "closed" };
    db.query.mockResolvedValue({ rows: [ticket] });
    const res = createResponse();

    await updateTicket(
      { body: { status: "closed" }, params: { id: "1" } },
      res,
      jest.fn(),
    );

    expect(db.query.mock.calls[0][1]).toEqual(["closed", "1"]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(ticket);
  });

  test("createComment rejects missing text", async () => {
    const res = createResponse();

    await createComment(
      { body: {}, params: { id: "1" }, user: { id: 4 } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test("createComment returns 404 when the ticket is absent", async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = createResponse();

    await createComment(
      { body: { text: "Hello" }, params: { id: "99" }, user: { id: 4 } },
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Ticket not found" });
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test("createComment inserts and returns a comment", async () => {
    const comment = { id: 2, ticket_id: 1, user_id: 4, text: "Fixed" };
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [comment] });
    const res = createResponse();

    await createComment(
      { body: { text: "Fixed" }, params: { id: "1" }, user: { id: 4 } },
      res,
      jest.fn(),
    );

    expect(db.query.mock.calls[0]).toEqual([
      "SELECT id FROM tickets WHERE id = $1",
      ["1"],
    ]);
    expect(db.query.mock.calls[1][1]).toEqual(["1", 4, "Fixed"]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(comment);
  });

  test("forwards database errors to Express", async () => {
    const error = new Error("database unavailable");
    const next = jest.fn();
    db.query.mockRejectedValue(error);

    await listTickets({}, createResponse(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
