const db = require("../../config/db");

/**
 * Get notifications for a specific user
 */
module.exports = async (username) => {
  try {
    const sql = "SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC LIMIT 50";
    const [rows] = await db.query(sql, [username]);
    return rows;
  } catch (err) {
    console.error("❌ DB Get Notifications Error:", err.message);
    throw err;
  }
};
