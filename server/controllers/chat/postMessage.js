const chatModel = require("../../models/chat");
const activeTypingStatus = require("./activeTypingStatus");

/**
 * Send Message (REST version)
 * POST /api/chat/:ticketId/messages
 */
module.exports = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { sender, message, attachment } = req.body;

    const newId = await chatModel.saveMessage(
      ticketId,
      sender,
      message,
      attachment,
    );

    // Clear typing status when message is sent
    if (activeTypingStatus[ticketId] && activeTypingStatus[ticketId][sender]) {
      delete activeTypingStatus[ticketId][sender];
    }

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};
