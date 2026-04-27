const db = require("../../config/db");

/**
 * Mark notification as read
 */
module.exports = async (id) => {
  try {
    const sql = "UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE id = ?";
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error("❌ DB Mark Read Error:", err.message);
    throw err;
  }
};
