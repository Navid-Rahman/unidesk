const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./auth");

describe("authenticateToken", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  function createResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  test("returns 401 when the authorization header is missing", () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token required" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when the authorization header is not a bearer token", () => {
    const req = { headers: { authorization: "Basic credentials" } };
    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token required" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 when the token is invalid", () => {
    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 when the token is expired", () => {
    const token = jwt.sign(
      { id: 1, email: "user@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: -1 },
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  test("attaches the user payload and calls next for a valid token", () => {
    const token = jwt.sign(
      { id: 1, email: "user@example.com", role: "ignored" },
      process.env.JWT_SECRET,
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(req.user).toEqual({ id: 1, email: "user@example.com" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
