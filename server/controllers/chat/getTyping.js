const activeTypingStatus = require("./activeTypingStatus");

/**
 * Get Typing Status
 * GET /api/chat/:ticketId/typing
 */
module.exports = (req, res) => {
  const { ticketId } = req.params;
  const { currentUser } = req.query;

  const ticketTyping = activeTypingStatus[ticketId] || {};
  const now = Date.now();
  let opponentIsTyping = false;

  for (const [user, lastTypedAt] of Object.entries(ticketTyping)) {
    if (user !== currentUser) {
      // 🟢 Logic: If they haven't sent a ping in 4 seconds, they are "Idle"
      if (now - lastTypedAt < 4000) {
        opponentIsTyping = true;
        break;
      } else {
        delete ticketTyping[user]; // Cleanup memory for idle users
      }
    }
  }
  res.json({ isTyping: opponentIsTyping });
};
