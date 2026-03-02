const db = require("../config/db");

exports.getMessagesByTicket = async (ticketId) => {
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

exports.saveMessage = async (ticketId, sender, message, attachment) => {
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

    // 🟢 2. NEW FIX: Update the ticket's 'updatedAt' timestamp so it jumps to the top of the list!
    await db.query("UPDATE tickets SET updatedAt = NOW() WHERE id = ?", [
      ticketId,
    ]);

    return result.insertId;
  } catch (error) {
    console.error("DB Error saving message:", error.message);
    throw error;
  }
};

// server/models/chatModel.js

exports.deleteMessage = async (messageId) => {
  try {
    // 🟢 SOFT DELETE: Update the message to a special string and clear attachments
    await db.query(
      "UPDATE chat_messages SET message = '[DELETED]', attachment = NULL WHERE id = ?",
      [messageId],
    );
    return true;
  } catch (error) {
    console.error("DB Error deleting message:", error);
    throw error;
  }
};

exports.markAsRead = async (ticketId, reader) => {
  try {
    const query =
      "UPDATE chat_messages SET is_read = 1 WHERE ticketId = ? AND sender != ?";
    await db.query(query, [ticketId, reader]);
    return true;
  } catch (error) {
    console.error("DB Error marking as read:", error);
  }
};
