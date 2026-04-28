const db = require("../../config/db");

/**
 * Get a single notification by ID
 */
module.exports = async (id) => {
  try {
    const sql = "SELECT * FROM notifications WHERE id = ?";
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  } catch (err) {
    console.error("❌ DB Find Notification Error:", err.message);
    throw err;
  }
};
