const express = require("express");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
const {
  apiLimiter,
  sanitizeInput,
  securityHeaders,
  startTokenCleanup,
} = require("./middleware/security");
const db = require("./config/db");

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

// Allowed frontend origins (no wildcard — strict whitelist)
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.38.52.2:3000",
];

// 1. Security headers (X-Frame-Options, X-XSS-Protection, etc.)
app.use(securityHeaders);

// 2. CORS: credentials enabled with strict origin whitelist
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 3. Cookie parser
app.use(cookieParser());

// 4. Body parsers with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// 5. Input sanitization (strip HTML/XSS from all request data)
app.use(sanitizeInput);

// 6. General rate limiter (100 req/min per IP)
app.use("/api/", apiLimiter);

// 7. REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/monitoring", monitoringRoutes);

app.get("/", (req, res) => {
  res.send("Backend Server is Running Successfully!");
});

app.get("/api/auth/validate", (req, res) => {
  res.status(200).send("Server is reachable");
});

// 8. Start Server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Access via network: http://10.38.52.2:${PORT}`);
  console.log(`✓ HTTP Polling Chat enabled`);
  console.log(`✓ Cookie-based auth enabled`);
  console.log(`✓ Security hardening active (rate limiting, XSS protection, secure headers)`);

  // Start periodic cleanup of expired auth tokens
  startTokenCleanup(db);
});
