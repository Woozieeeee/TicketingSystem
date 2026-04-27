const chatModel = require("../../models/chat");

/**
 * Delete Message (REST version)
 * DELETE /api/chat/messages/:messageId
 */
module.exports = async (req, res) => {
  try {
    const { messageId } = req.params;
    await chatModel.deleteMessage(messageId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
