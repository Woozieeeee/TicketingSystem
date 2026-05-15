// server/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  createNotification,
  deleteNotification,
  remindTicket, // Idagdag ito rito
} = require("../controllers/notificationController");

// GET notifications for a user
router.get("/:username", getUserNotifications);

// PUT mark as read
router.put("/:notificationId/read", markAsRead);

// POST create notification
router.post("/", createNotification);

// DELETE notification
router.delete("/:notificationId", deleteNotification);

// POST remind (Idagdag ang route na ito para sa reminders)
router.post("/remind/:id", remindTicket);

module.exports = router;