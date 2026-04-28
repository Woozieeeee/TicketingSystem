const Notification = require("../../models/notification");

/**
 * Create a new notification
 * POST /api/notifications
 */
module.exports = async (req, res) => {
  try {
    const { username, message, ticketGlobalId, type } = req.body;

    if (!username || !message) {
      return res.status(400).json({
        error: "Username and message are required",
      });
    }

    const notification = await Notification.create({
      username,
      message,
      ticketGlobalId,
      type,
    });

    return res.status(201).json({
      success: true,
      message: "Notification created",
      id: notification.id,
    });
  } catch (error) {
    console.error("❌ Create Notification Error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};
