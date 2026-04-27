const Notification = require("../../models/notification");

/**
 * Mark notification as read
 * PATCH /api/notifications/:notificationId/read
 */
module.exports = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    const updated = await Notification.markAsRead(notificationId);

    if (!updated) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("❌ Mark Read Error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};
