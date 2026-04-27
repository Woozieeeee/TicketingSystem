const db = require("../../config/db");

/**
 * Mark messages as read for a ticket
 */
module.exports = async (ticketId, reader) => {
  try {
    const query =
      "UPDATE chat_messages SET is_read = 1 WHERE ticketId = ? AND sender != ?";
    await db.query(query, [ticketId, reader]);
    return true;
  } catch (error) {
    console.error("DB Error marking as read:", error);
  }
};
