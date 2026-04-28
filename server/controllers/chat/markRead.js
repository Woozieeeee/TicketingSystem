const chatModel = require("../../models/chat");

/**
 * Mark as Read (REST version)
 * PATCH /api/chat/:ticketId/read
 */
module.exports = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reader } = req.body;
    await chatModel.markAsRead(ticketId, reader);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};
