# UniDesk — System Specification (spec.md)

## 1. Project Goal

UniDesk is a simple internal ticketing web application for users to submit, track, and comment on support issues.

---

## 2. Database Tables (3 Tables)

1. **`users`**
   - `id`: integer, primary key
   - `name`: string
   - `email`: string (unique)
   - `password`: string (hashed)

2. **`tickets`**
   - `id`: integer, primary key
   - `title`: string
   - `description`: string
   - `status`: string ('open' or 'closed', default: 'open')
   - `user_id`: integer (links to users.id)

3. **`comments`**
   - `id`: integer, primary key
   - `ticket_id`: integer (links to tickets.id)
   - `user_id`: integer (links to users.id)
   - `text`: string

---

## 3. API Endpoints

- **Auth:**
  - `POST /api/register` — Register a new user
  - `POST /api/login` — Log in and receive a JWT token
- **Tickets:**
  - `GET /api/tickets` — List all tickets
  - `POST /api/tickets` — Create a ticket
  - `GET /api/tickets/:id` — Get one ticket with its comments
  - `PATCH /api/tickets/:id` — Update ticket status (e.g. open -> closed)
- **Comments:**
  - `POST /api/tickets/:id/comments` — Add a comment to a ticket

---

## 4. User Interface (3 Simple Views)

1. **Login & Register Form**
2. **Ticket List Page** (view all tickets + button to create a new ticket)
3. **Ticket Detail Page** (view description, change status, and post comments)

Note: The UI will be minimalistic, focusing on functionality rather than design. There should be no complex navigation or dashboards. No need for any UI specificiations beyond the basic forms and lists.

---

## 5. Acceptance Checklist

- [ ] Users can register, log in, and stay logged in.
- [ ] Users can create tickets and see them in the ticket list.
- [ ] Users can open any ticket, read comments, and add new comments.
- [ ] Automated tests cover login, ticket creation, and comments (>70% coverage).

---

## 6. Out of Scope (Will NOT be built)

- No email notifications.
- No file or image uploads.
- No complex roles or admin dashboards.
- No ticket assignment or user roles.
- No ticket search or filtering.
- No ticket history or audit logs.
- No ticket priority or categorization.
- No ticket due dates or SLA tracking.
- No ticket attachments or file uploads.
- No ticket notifications or alerts.
- No ticket reporting or analytics.
