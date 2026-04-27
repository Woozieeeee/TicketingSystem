const chatModel = require("../../models/chat");

/**
 * Get Messages (REST version)
 * GET /api/chat/:ticketId/messages
 */
module.exports = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const history = await chatModel.getMessagesByTicket(ticketId);
    res.json(history);
  } catch (error) {
    console.error("Error loading history:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
};
