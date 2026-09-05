const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
}

async function register(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword],
    );
    const user = result.rows[0];

    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await db.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const responseUser = { id: user.id, name: user.name, email: user.email };
    return res.status(200).json({
      user: responseUser,
      token: createToken(responseUser),
    });
  } catch (error) {
    return next(error);
  }
}

router.post("/api/register", register);
router.post("/api/login", login);

module.exports = router;
module.exports.register = register;
module.exports.login = login;
