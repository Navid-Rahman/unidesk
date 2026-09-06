# UniDesk — Milestones

## 🔹 Milestone 1: Specs and initial tasks

- [x] Write `spec.md`
- [x] Write custom`AGENTS.md` rules.

## 🔹 Milestone 2: Database setup

- [x] Set up postgresql database (Neon.tech)
- [x] Setup `.env` for database connection.
- [x] Create `src/db.js` connection pool.
- [x] Create and run migration script for `users`, `tickets`, `comments`.

## 🔹 Milestone 3: Authentication works

- [x] Create jwt authentication
- [x] Implement `POST /api/register`
- [x] Implement `POST /api/login` - check for correct password jwt token returned and login
- [x] Review: Check status codes (400 vs 401 vs 201) and security edge cases.

## 🔹 Milestone 4: Tickets & Comments CRUD

- [x] Implement `GET /api/tickets` (list of all tickets).
- [x] Implement `POST /api/tickets` (create ticket).
- [x] Implement `GET /api/tickets/:id` (fetch ticket + comments).
- [x] Implement `PATCH /api/tickets/:id` (update status).
- [x] Implement `POST /api/tickets/:id/comments` (add comment).
- [x] Review: Check error handling.

## 🔹 Milestone 5: Testing

- [x] Write integration test for all endpoints
- [x] Test happy paths (register -> login -> create ticket -> comment).
- [x] Test failure paths (invalid login, missing fields, bad token, all 404 scenarios).

## 🔹 Milestone 6: Frontend

- [x] Set up React app with 3 minimalistic views:
  1. Login/Register view.
  2. Ticket List view + new ticket form.
  3. Ticket Detail view + comment box & status toggle.
- [x] Connect React frontend to Express API with `fetch`/`axios`.
