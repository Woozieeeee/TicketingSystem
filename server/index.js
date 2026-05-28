// server/index.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser"); // 🟢 Siguraduhing naka-install ito via npm

// 🟢 Global middleware sensors
const { logPerformance, detectSuspiciousActivity } = require("./middleware/monitoring");

// Routes
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/users");
const monitoringRoutes = require("./routes/monitoring");

const app = express();
const PORT = 3001;

const server = http.createServer(app);

// ==========================================
// 🛠️ PRE-ROUTING GLOBAL MIDDLEWARES LAYER
// ==========================================

// 1. Cookie Parser - Dapat mauna sa lahat para laging available ang req.cookies
app.use(cookieParser());

// 2. Security & Performance Sensors - Saluhin agad ang request sa pinaka-gate pa lang
app.use(logPerformance);          // Tagasubaybay kung gaano kabilis sumagot ang server mo
app.use(detectSuspiciousActivity); // Tagabantay laban sa malilikot o kaduda-dudang request urls/user-agents

// 3. CORS Policy - Dynamic credentials binding para sa handshake ng browser
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Papayagan nito ang pagpasa ng cookies at headers
  })
);

// 4. Body Parsers with High Limits for Base64 Strings
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ==========================================
// 🛣️ REST API ROUTING LAYER
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/monitoring", monitoringRoutes);

// Base Validation Endpoints
app.get("/", (req, res) => {
  res.send("Backend Server is Running Successfully!");
});

// ==========================================
// 🚀 SERVER GATEWAY CLUSTER INITIALIZATION
// ==========================================
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Access via network: http://10.38.52.2:${PORT}`);
  console.log(`✓ HTTP Polling Chat enabled`);
  console.log(`✓ Global Request Security Sensors Intercepting Active`);
  console.log(`✓ Monitoring Analytics Router linked successfully`);
});