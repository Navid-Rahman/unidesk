jest.mock("../db", () => ({ query: jest.fn() }));
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn() }));

const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRouter = require("./auth");

const { register, login } = authRouter;

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("auth route handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("register", () => {
    test("returns 400 when a required field is missing", async () => {
      const req = { body: { name: "Test User", email: "test@example.com" } };
      const res = createResponse();
      const next = jest.fn();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(db.query).not.toHaveBeenCalled();
    });

    test("returns 400 when the email already exists", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const req = {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password",
        },
      };
      const res = createResponse();

      await register(req, res, jest.fn());

      expect(db.query).toHaveBeenCalledWith(
        "SELECT id FROM users WHERE email = $1",
        ["test@example.com"],
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email already exists" });
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("hashes and inserts the user using parameterized values", async () => {
      const user = { id: 1, name: "Test User", email: "test@example.com" };
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [user] });
      bcrypt.hash.mockResolvedValue("hashed-password");
      jwt.sign.mockReturnValue("signed-token");
      const req = { body: { ...user, password: "password" } };
      const res = createResponse();

      await register(req, res, jest.fn());

      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(db.query.mock.calls[1][1]).toEqual([
        "Test User",
        "test@example.com",
        "hashed-password",
      ]);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, email: "test@example.com" },
        "test-secret",
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user, token: "signed-token" });
    });
  });

  describe("login", () => {
    test("returns 400 when credentials are missing", async () => {
      const res = createResponse();

      await login({ body: { email: "test@example.com" } }, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(db.query).not.toHaveBeenCalled();
    });

    test("returns 401 when the user does not exist", async () => {
      db.query.mockResolvedValue({ rows: [] });
      const res = createResponse();

      await login(
        { body: { email: "missing@example.com", password: "password" } },
        res,
        jest.fn(),
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("returns 401 when the password does not match", async () => {
      db.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            password: "hash",
          },
        ],
      });
      bcrypt.compare.mockResolvedValue(false);
      const res = createResponse();

      await login(
        { body: { email: "test@example.com", password: "wrong" } },
        res,
        jest.fn(),
      );

      expect(bcrypt.compare).toHaveBeenCalledWith("wrong", "hash");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    test("returns a public user and token for valid credentials", async () => {
      db.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            password: "hash",
          },
        ],
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("signed-token");
      const res = createResponse();

      await login(
        { body: { email: "test@example.com", password: "password" } },
        res,
        jest.fn(),
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: { id: 1, name: "Test User", email: "test@example.com" },
        token: "signed-token",
      });
    });
  });

  test("forwards database errors to Express", async () => {
    const error = new Error("database unavailable");
    db.query.mockRejectedValue(error);
    const next = jest.fn();

    await login(
      { body: { email: "test@example.com", password: "password" } },
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });
});
