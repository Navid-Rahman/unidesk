import { useEffect, useState } from "react";
import { api } from "./api";

export function AuthView({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const result =
        mode === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.register(form);
      onAuthenticated(result.token);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="centered">
      <section className="card auth-card">
        <h1>UniDesk</h1>
        <div className="tabs">
          <button type="button" onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" onClick={() => setMode("register")}>
            Register
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function TicketListView({ token, onSelect, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listTickets(token)
      .then(setTickets)
      .catch((requestError) => {
        setError(requestError.message);
      });
  }, [token]);

  async function createTicket(event) {
    event.preventDefault();
    setError("");
    try {
      const ticket = await api.createTicket(token, form);
      setTickets([ticket, ...tickets]);
      setForm({ title: "", description: "" });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="page">
      <header>
        <h1>Tickets</h1>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>
      <section className="card">
        <h2>New ticket</h2>
        <form onSubmit={createTicket}>
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              required
            />
          </label>
          <button type="submit">Create ticket</button>
        </form>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="ticket-list">
        {tickets.length === 0 && !error ? (
          <p>No tickets yet.</p>
        ) : (
          tickets.map((ticket) => (
            <button
              className="ticket card"
              type="button"
              key={ticket.id}
              onClick={() => onSelect(ticket.id)}
            >
              <strong>{ticket.title}</strong>
              <span>{ticket.status}</span>
            </button>
          ))
        )}
      </section>
    </main>
  );
}

export function TicketDetailView({ token, ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function loadTicket() {
    try {
      setTicket(await api.getTicket(token, ticketId));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadTicket();
  }, [token, ticketId]);

  async function toggleStatus() {
    try {
      const status = ticket.status === "open" ? "closed" : "open";
      const updated = await api.updateTicket(token, ticketId, status);
      setTicket({ ...ticket, ...updated });
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    try {
      const comment = await api.createComment(token, ticketId, text);
      setTicket({ ...ticket, comments: [...ticket.comments, comment] });
      setText("");
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Back to tickets
      </button>
      {error && <p className="error">{error}</p>}
      {ticket && (
        <>
          <section className="card">
            <h1>{ticket.title}</h1>
            <p>{ticket.description}</p>
            <p>Status: {ticket.status}</p>
            <button type="button" onClick={toggleStatus}>
              Mark as {ticket.status === "open" ? "closed" : "open"}
            </button>
          </section>
          <section className="card">
            <h2>Comments</h2>
            {ticket.comments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              ticket.comments.map((comment) => (
                <p key={comment.id}>{comment.text}</p>
              ))
            )}
            <form onSubmit={addComment}>
              <label>
                Add comment
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  required
                />
              </label>
              <button type="submit">Post comment</button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [selectedTicket, setSelectedTicket] = useState(null);

  function authenticate(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setSelectedTicket(null);
  }

  if (!token) return <AuthView onAuthenticated={authenticate} />;
  if (selectedTicket) {
    return (
      <TicketDetailView
        token={token}
        ticketId={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }
  return (
    <TicketListView
      token={token}
      onSelect={setSelectedTicket}
      onLogout={logout}
    />
  );
}
