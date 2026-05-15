const express = require("express");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");

// Routes
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require('./routes/users');
const monitoringRoutes = require('./routes/monitoring');

const app = express();
const PORT = 3001;

const server = http.createServer(app);

// Allowed frontend origins
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.38.52.2:3000",
];

// 1. CORS: credentials enabled with specific origins
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 2. Cookie parser
app.use(cookieParser());

// 3. Middleware with increased limits for Base64 Photos
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// 4. REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.get("/", (req, res) => {
  res.send("Backend Server is Running Successfully!");
});

// 5. Start Server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Access via network: http://10.38.52.2:${PORT}`);
  console.log(`✓ HTTP Polling Chat enabled`);
  console.log(`✓ Cookie-based auth enabled`);
});
app.get("/api/auth/validate", (req, res) => {
  res.status(200).send("Server is reachable");
});
