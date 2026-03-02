const express = require("express");
const cors = require("cors");
const http = require("http");

// Routes
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const PORT = 3001;

const server = http.createServer(app);

// 1. UPDATED CORS: Perfect for Local/Mobile testing
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// 2. Middleware with increased limits for Base64 Photos
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// 3. REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.get("/", (req, res) => {
  res.send("Backend Server is Running Successfully!");
});

// 4. Start Server
server.listen(PORT, "0.0.0.0", () => {
  // 🟢 Added "0.0.0.0" to listen on your local network
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Access via network: http://10.38.52.2:${PORT}`);
  console.log(`✓ HTTP Polling Chat enabled`);
});
