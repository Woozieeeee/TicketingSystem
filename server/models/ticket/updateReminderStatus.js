const db = require("../../config/db");

/**
 * Update reminder status
 */
module.exports = async (id, flag) => {
  try {
    const sql = `
      UPDATE tickets 
      SET reminder_flag = ?, last_reminded_at = NOW() 
      WHERE id = ?
    `;
    const [result] = await db.query(sql, [flag ? 1 : 0, id]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error("❌ Ticket Update Reminder Error:", err.message);
    throw err;
  }
};
