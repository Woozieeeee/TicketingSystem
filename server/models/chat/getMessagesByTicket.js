const db = require("../../config/db");

/**
 * Get messages by ticket ID
 */
module.exports = async (ticketId) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM chat_messages WHERE ticketId = ? ORDER BY created_at ASC",
      [ticketId],
    );
    return rows;
  } catch (error) {
    console.error("DB Error fetching messages:", error);
    throw error;
  }
};
