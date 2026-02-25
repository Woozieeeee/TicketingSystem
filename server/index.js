const express = require("express");
const cors = require("cors");

// Correct relative paths: index.js and the routes folder are siblings
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

// Use the routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
