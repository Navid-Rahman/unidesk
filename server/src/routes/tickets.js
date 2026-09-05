const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

async function listTickets(req, res, next) {
  try {
    const result = await db.query(
      "SELECT * FROM tickets ORDER BY created_at DESC",
      [],
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
}

async function createTicket(req, res, next) {
  const { title, description } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "Title and description are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO tickets (title, description, status, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, "open", req.user.id],
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
}

async function getTicket(req, res, next) {
  try {
    const ticketResult = await db.query(
      "SELECT * FROM tickets WHERE id = $1",
      [req.params.id],
    );
    const ticket = ticketResult.rows[0];

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const commentsResult = await db.query(
      `SELECT * FROM comments
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [req.params.id],
    );
    return res.status(200).json({ ...ticket, comments: commentsResult.rows });
  } catch (error) {
    return next(error);
  }
}

async function updateTicket(req, res, next) {
  const { status } = req.body;

  if (status !== "open" && status !== "closed") {
    return res.status(400).json({ error: "Status must be open or closed" });
  }

  try {
    const result = await db.query(
      `UPDATE tickets
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id],
    );
    const ticket = result.rows[0];

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    return next(error);
  }
}

async function createComment(req, res, next) {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const ticketResult = await db.query(
      "SELECT id FROM tickets WHERE id = $1",
      [req.params.id],
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const result = await db.query(
      `INSERT INTO comments (ticket_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, req.user.id, text],
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
}

router.use(authenticateToken);
router.get("/api/tickets", listTickets);
router.post("/api/tickets", createTicket);
router.get("/api/tickets/:id", getTicket);
router.patch("/api/tickets/:id", updateTicket);
router.post("/api/tickets/:id/comments", createComment);

module.exports = router;
module.exports.listTickets = listTickets;
module.exports.createTicket = createTicket;
module.exports.getTicket = getTicket;
module.exports.updateTicket = updateTicket;
module.exports.createComment = createComment;
