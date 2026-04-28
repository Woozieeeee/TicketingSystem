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
// server/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notification = require("../controllers/notification");

// GET notifications for a user
router.get("/:username", notification.getUserNotifications);

// PATCH mark as read
router.patch("/:notificationId/read", notification.markAsRead);

// POST create notification
router.post("/", notification.createNotification);

// DELETE notification
router.delete("/:notificationId", notification.deleteNotification);

module.exports = router;
