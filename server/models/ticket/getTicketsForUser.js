const db = require("../../config/db");

/**
 * Get tickets for User role (with unread counts)
 */
module.exports = async (username) => {
  try {
    const sql = `
      SELECT t.*, 
      (SELECT COUNT(*) FROM chat_messages cm WHERE cm.ticketId = t.id AND cm.sender != ? AND cm.is_read = 0) AS unreadCount 
      FROM tickets t WHERE t.createdBy = ? ORDER BY t.date DESC
    `;
    const [rows] = await db.query(sql, [username, username]);
    return rows;
  } catch (err) {
    console.error("❌ Ticket Fetch User Error:", err.message);
    throw err;
  }
};
