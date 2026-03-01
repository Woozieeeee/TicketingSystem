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

    const [result] = await db.query(
      "INSERT INTO chat_messages (ticketId, sender, message, attachment, created_at) VALUES (?, ?, ?, ?, NOW())",
      [ticketId, sender, message || "", attachment || null],
    );
    return result.insertId;
  } catch (error) {
    console.error("DB Error saving message:", error.message);
    throw error;
  }
};

exports.deleteMessage = async (messageId) => {
  try {
    await db.query("DELETE FROM chat_messages WHERE id = ?", [messageId]);
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
