const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Load from project root
const { PrismaClient } = require("@prisma/client");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

console.log("Starting server...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ set" : "✗ NOT SET");

app.use(express.json());
app.use(cors());

let prisma = null;

// Lazy-load prisma from centralized config
const getPrisma = () => {
  if (!prisma) {
    try {
      console.log("Loading Prisma client...");
      prisma = require("./config/db");
      console.log("✓ Prisma client ready");
    } catch (err) {
      console.error("✗ Prisma initialization failed:", err?.message);
      throw err;
    }
  }
  return prisma;
};

// REGISTER ROUTE
app.post("/api/register", async (req, res) => {
  const { username, password, department } = req.body;
  console.log("POST /api/register:", { username, department });
  try {
    const db = getPrisma();
    const headExists = await db.user.findFirst({
      where: { dept: department, role: "Head" },
    });
    const role = headExists ? "User" : "Head";

    const newUser = await db.user.create({
      data: { username, password, role, dept: department },
    });
    console.log("✓ User registered:", newUser.id);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("✗ Register error:", error?.message || error);
    res.status(400).json({ message: "Registration failed or user exists" });
  }
});

// LOGIN ROUTE
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("POST /api/login:", { username });
  try {
    const db = getPrisma();
    const user = await db.user.findUnique({ where: { username } });
    if (user && user.password === password) {
      console.log("✓ Login successful:", username);
      res.json(user);
    } else {
      console.log("✗ Invalid credentials:", username);
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("✗ Login error:", error?.message);
    res.status(500).json({ message: "Server error" });
  }
});

// HEALTH CHECK
app.get("/health", async (req, res) => {
  console.log("GET /health");
  try {
    const db = getPrisma();
    const count = await db.user.count();
    console.log("✓ Health check OK, users:", count);
    res.json({
      ok: true,
      message: "Server and database connected",
      users: count,
    });
  } catch (err) {
    console.error("✗ Health check error:", err?.message);
    res.status(500).json({ ok: false, error: err?.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Keep process alive
server.keepAliveTimeout = 65000;

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
