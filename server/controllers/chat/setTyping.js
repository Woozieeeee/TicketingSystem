const activeTypingStatus = require("./activeTypingStatus");

/**
 * Update Typing Status (In-memory)
 * POST /api/chat/:ticketId/typing
 */
module.exports = (req, res) => {
  const { ticketId } = req.params;
  const { username, isTyping } = req.body;

  if (!activeTypingStatus[ticketId]) {
    activeTypingStatus[ticketId] = {};
  }

  if (isTyping) {
    activeTypingStatus[ticketId][username] = Date.now();
  } else {
    delete activeTypingStatus[ticketId][username];
  }
  res.json({ success: true });
};
