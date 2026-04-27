const db = require("../../config/db");

/**
 * Get tickets for Head role (with unread counts)
 */
module.exports = async (dept) => {
  try {
    const sql = `
      SELECT t.*, 
      (SELECT COUNT(*) FROM chat_messages cm WHERE cm.ticketId = t.id AND cm.sender != 'Support Admin' AND cm.is_read = 0) AS unreadCount 
      FROM tickets t WHERE t.dept = ? ORDER BY t.date DESC
    `;
    const [rows] = await db.query(sql, [dept]);
    return rows;
  } catch (err) {
    console.error("❌ Ticket Fetch Head Error:", err.message);
    throw err;
  }
};
