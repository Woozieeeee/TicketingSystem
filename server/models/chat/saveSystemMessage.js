const db = require("../../config/db");

/**
 * Save a system message to chat
 */
module.exports = async (ticketId, message) => {
  try {
    const [result] = await db.query(
      "INSERT INTO chat_messages (ticketId, sender, message, created_at, is_read) VALUES (?, 'System', ?, NOW(), 0)",
      [ticketId, message],
    );

    // Update ticket's updatedAt timestamp
    await db.query("UPDATE tickets SET updatedAt = NOW() WHERE id = ?", [
      ticketId,
    ]);

    return result.insertId;
  } catch (error) {
    console.error("DB Error saving system message:", error.message);
    throw error;
  }
};
