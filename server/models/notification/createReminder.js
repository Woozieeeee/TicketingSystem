const db = require("../../config/db");

/**
 * Create reminder notifications for department heads
 */
module.exports = async (ticketId, ticketTitle, dept, createdBy) => {
  try {
    // Find department heads
    const [headRows] = await db.query(
      "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
      [dept]
    );

    const createdNotifications = [];
    const message = `Reminder: Ticket #${ticketId} ("${ticketTitle}") from ${createdBy} needs your attention.`;

    // Create notification for each head
    for (const head of headRows) {
      const sql = `
        INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at)
        VALUES (?, ?, ?, 'reminder', 0, NOW(), NOW())
      `;
      const [result] = await db.query(sql, [head.username, message, ticketId]);
      createdNotifications.push({
        id: result.insertId,
        username: head.username,
        message,
        ticketGlobalId: ticketId,
      });
    }

    return createdNotifications;
  } catch (err) {
    console.error("❌ DB Create Reminder Error:", err.message);
    throw err;
  }
};
