// In your routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  createNotification,
  deleteNotification,
} = require("../controllers/notificationController");

// GET notifications for a user
router.get("/:username", getUserNotifications);

// PATCH mark as read
router.patch("/:notificationId/read", markAsRead);

// POST create notification
router.post("/", createNotification);

// DELETE notification
router.delete("/:notificationId", deleteNotification);

module.exports = router;
