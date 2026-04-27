const Notification = require("../../models/notification");

/**
 * Get notifications for a specific user
 * GET /api/notifications/:username
 */
module.exports = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const notifications = await Notification.getByUsername(username);
    return res.status(200).json(notifications || []);
  } catch (error) {
    console.error("❌ Get Notifications Error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};
