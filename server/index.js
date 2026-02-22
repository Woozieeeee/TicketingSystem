const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Load from project root
const { PrismaClient } = require("@prisma/client");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

console.log("Starting server...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ set" : "✗ NOT SET");

// Parse JSON bodies
app.use(express.json());
app.use(cors());

// Log raw incoming requests for debugging (remove or lower in prod)
app.use((req, res, next) => {
  console.log(`--> ${req.method} ${req.url}`);
  next();
});

// JSON body parse error handler (captures invalid JSON sent to server)
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    console.error("✗ Body parse error:", err.message);
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  next(err);
});

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

    // Use raw SQL to check and insert, avoiding Prisma schema conflicts with existing DB
    const existing = await db.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE username = $1 LIMIT 1`,
      username,
    );
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const headExistsResult = await db.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE dept = $1 AND role = $2 LIMIT 1`,
      department,
      "Head",
    );
    const role =
      headExistsResult && headExistsResult.length > 0 ? "User" : "Head";

    // Generate a unique string id and insert
    const id = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const insertSql = `INSERT INTO "User" (id, username, password, role, dept) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const inserted = await db.$queryRawUnsafe(
      insertSql,
      id,
      username,
      password,
      role,
      department,
    );
    console.log("✓ User registered:", inserted[0]?.id || id);
    res.status(201).json(inserted[0]);
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
    // Use raw SQL to find user
    const users = await db.$queryRawUnsafe(
      `SELECT id, username, password, role, dept FROM "User" WHERE username = $1 LIMIT 1`,
      username,
    );
    const user = users && users.length > 0 ? users[0] : null;
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

app.post("/api/tickets", async (req, res) => {
  const { title, description, userId, category, status, dept, date } = req.body;
  console.log("POST /api/tickets:", { title, userId });

  try {
    const db = getPrisma();
    // Use raw SQL to insert ticket, avoiding Prisma type mismatches
    const id = `t_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();
    const insertSql = `INSERT INTO "Ticket" (id, title, category, description, status, "userId", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const inserted = await db.$queryRawUnsafe(
      insertSql,
      id,
      title,
      category,
      description,
      status || "PENDING",
      userId,
      date || now,
      now,
    );
    console.log("✓ Ticket created:", inserted[0]?.id);
    res.status(200).json(inserted[0]);
  } catch (err) {
    console.error("✗ Create ticket error:", err?.message || err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// GET ticket by id
app.get("/api/tickets/:id", async (req, res) => {
  const { id } = req.params;
  console.log("GET /api/tickets/:id", id);

  try {
    const db = getPrisma();
    const tickets = await db.$queryRawUnsafe(
      `SELECT id, title, description, category, status, "userId", "createdAt", "updatedAt" FROM "Ticket" WHERE id = $1 LIMIT 1`,
      id,
    );
    if (tickets && tickets.length > 0) {
      res.json(tickets[0]);
    } else {
      res.status(404).json({ error: "Ticket not found" });
    }
  } catch (err) {
    console.error("✗ Get ticket error:", err?.message || err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// PUT ticket by id (update)
app.put("/api/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, status, category, priority } = req.body;
  console.log("PUT /api/tickets/:id", id, { title, status });

  try {
    const db = getPrisma();

    // Build dynamic SQL based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }

    updates.push(`"updatedAt" = now()`);
    values.push(id);

    const updateSql = `UPDATE "Ticket" SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const updated = await db.$queryRawUnsafe(updateSql, ...values);

    if (updated && updated.length > 0) {
      console.log("✓ Ticket updated:", id);
      res.json(updated[0]);
    } else {
      res.status(404).json({ error: "Ticket not found" });
    }
  } catch (err) {
    console.error("✗ Update ticket error:", err?.message || err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// GET all tickets
app.get("/api/tickets/", async (req, res) => {
  console.log("GET /api/tickets/");
  try {
    const db = getPrisma();
    const tickets = await db.$queryRawUnsafe(
      `SELECT t.id, t.title, t.description, t.category, t.status, t."userId", t."createdAt", t."updatedAt", u.username as "createdBy", u.dept FROM "Ticket" t JOIN "User" u ON t."userId" = u.id ORDER BY t."createdAt" DESC`,
    );
    res.json(tickets || []);
  } catch (err) {
    console.error("✗ Get all tickets error:", err?.message || err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const db = getPrisma();
    const userCount = await db.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "User"`,
    );
    res.json({
      ok: true,
      message: "Server and database connected",
      users: userCount?.[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// Start server (ensure `server` exists before using it)
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
