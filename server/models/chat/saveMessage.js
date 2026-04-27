const db = require("../../config/db");

/**
 * Save a new message
 */
module.exports = async (ticketId, sender, message, attachment) => {
  try {
    if (!ticketId || !sender || (!message && !attachment)) {
      console.error("❌ Cannot save message: Missing required fields");
      return null;
    }

    // 1. Save the actual message
    const [result] = await db.query(
      "INSERT INTO chat_messages (ticketId, sender, message, attachment, created_at) VALUES (?, ?, ?, ?, NOW())",
      [ticketId, sender, message || "", attachment || null],
    );

    // 2. Update the ticket's 'updatedAt' timestamp so it jumps to the top of the list
    await db.query("UPDATE tickets SET updatedAt = NOW() WHERE id = ?", [
      ticketId,
    ]);

    return result.insertId;
  } catch (error) {
    console.error("DB Error saving message:", error.message);
    throw error;
  }
};
