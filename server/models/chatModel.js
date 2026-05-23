// server/models/chatModel.js
const db = require("../config/db");

// 1. Fetch all chat history for a specific ticket
exports.getMessagesByTicket = async (ticketId) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM chat_messages WHERE ticketId = ? ORDER BY created_at ASC",
      [ticketId]
    );
    return rows;
  } catch (error) {
    console.error("DB Error fetching messages:", error);
    throw error; // I-throw para mahuli ng controller try-catch block
  }
};

// 2. Fetch latest messages for polling/real-time updates
exports.getLatestMessages = async (ticketId, lastMessageId = null, lastTimestamp = null) => {
  try {
    let query = "SELECT * FROM chat_messages WHERE ticketId = ?";
    const params = [ticketId];
    
    if (lastMessageId) {
      query += " AND id > ?";
      params.push(lastMessageId);
    } else if (lastTimestamp) {
      query += " AND created_at > ?";
      params.push(lastTimestamp);
    }
    
    query += " ORDER BY created_at ASC";
    
    const [rows] = await db.query(query, params);
    return rows;
  } catch (error) {
    console.error("DB Error fetching latest messages:", error);
    throw error;
  }
};

// 3. Count unread messages where the current user is not the sender
exports.getUnreadCount = async (username) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM chat_messages 
       WHERE sender != ? AND is_read = 0`,
      [username]
    );
    return rows[0].count;
  } catch (error) {
    console.error("DB Error fetching unread count:", error);
    throw error;
  }
};

// 4. Save new message and trigger update to ticket's updatedAt timestamp
exports.saveMessage = async (ticketId, sender, message, attachment) => {
  try {
    if (!ticketId || !sender || (!message && !attachment)) {
      console.error("❌ Cannot save message: Missing required fields");
      return null;
    }

    // Isave ang bagong mensahe
    const [result] = await db.query(
      "INSERT INTO chat_messages (ticketId, sender, message, attachment, created_at) VALUES (?, ?, ?, ?, NOW())",
      [ticketId, sender, message || "", attachment || null],
    );

    // 🟢 FIX: I-update ang main ticket time para umakyat ito sa itaas ng dashboard view ng personnel/user
    await db.query("UPDATE tickets SET updatedAt = NOW() WHERE id = ?", [ticketId]);

    return result.insertId;
  } catch (error) {
    console.error("DB Error saving message:", error.message);
    throw error;
  }
};

// 5. Soft delete a message by changing the text to [DELETED]
exports.deleteMessage = async (messageId) => {
  try {
    await db.query(
      "UPDATE chat_messages SET message = '[DELETED]', attachment = NULL WHERE id = ?",
      [messageId]
    );
    return true;
  } catch (error) {
    console.error("DB Error deleting message:", error);
    return false; // Safe return para iwas runtime crash
  }
};

// 6. Mark messages as read when viewing the chat screen
exports.markAsRead = async (ticketId, reader) => {
  try {
    const query = "UPDATE chat_messages SET is_read = 1 WHERE ticketId = ? AND sender != ?";
    await db.query(query, [ticketId, reader]);
    return true;
  } catch (error) {
    console.error("DB Error marking as read:", error);
    return false;
  }
};