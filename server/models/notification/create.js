const db = require("../../config/db");

/**
 * Create a new notification
 */
module.exports = async (notificationData) => {
  const { username, message, ticketGlobalId, type } = notificationData;
  try {
    const sql = `
      INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, NOW(), NOW())
    `;
    const [result] = await db.query(sql, [
      username,
      message,
      ticketGlobalId || null,
      type || "default",
    ]);
    return { id: result.insertId, ...notificationData };
  } catch (err) {
    console.error("❌ DB Create Notification Error:", err.message);
    throw err;
  }
};
