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

- [ ] Implement `GET /api/tickets` (list of all tickets).
- [ ] Implement `POST /api/tickets` (create ticket).
- [ ] Implement `GET /api/tickets/:id` (fetch ticket + comments).
- [ ] Implement `PATCH /api/tickets/:id` (update status).
- [ ] Implement `POST /api/tickets/:id/comments` (add comment).
- [ ] Review: Check error handling.
