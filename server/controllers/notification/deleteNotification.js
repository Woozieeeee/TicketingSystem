const Notification = require("../../models/notification");

/**
 * Delete a notification
 * DELETE /api/notifications/:notificationId
 */
module.exports = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    const deleted = await Notification.delete(notificationId);

    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("❌ Delete Notification Error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};
