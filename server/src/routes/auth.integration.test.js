jest.mock("../db", () => ({ query: jest.fn() }));

const express = require("express");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const authRouter = require("./auth");

describe("auth routes", () => {
  const app = express();
  app.use(express.json());
  app.use(authRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "integration-secret";
  });

  test("POST /api/register creates a user and returns a valid token", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockImplementationOnce(async (_query, values) => ({
        rows: [{ id: 1, name: values[0], email: values[1] }],
      }));

    const response = await request(app).post("/api/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password",
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({
      id: 1,
      name: "Test User",
      email: "test@example.com",
    });
    expect(jwt.verify(response.body.token, "integration-secret")).toMatchObject(
      {
        id: 1,
        email: "test@example.com",
      },
    );
    expect(await bcrypt.compare("password", db.query.mock.calls[1][1][2])).toBe(
      true,
    );
  });

  test("POST /api/register rejects a duplicate email", async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const response = await request(app).post("/api/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email already exists" });
  });

  test("POST /api/login authenticates a user and omits the password", async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          password: await bcrypt.hash("password", 10),
        },
      ],
    });

    const response = await request(app).post("/api/login").send({
      email: "test@example.com",
      password: "password",
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: 1,
      name: "Test User",
      email: "test@example.com",
    });
    expect(response.body.user.password).toBeUndefined();
    expect(jwt.verify(response.body.token, "integration-secret")).toMatchObject(
      {
        id: 1,
        email: "test@example.com",
      },
    );
  });

  test("POST /api/login rejects invalid credentials", async () => {
    db.query.mockResolvedValue({ rows: [] });

    const response = await request(app).post("/api/login").send({
      email: "missing@example.com",
      password: "password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials" });
  });
});
