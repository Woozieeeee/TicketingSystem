const db = require("../../config/db");

/**
 * Find user by username
 */
module.exports = async (username) => {
  try {
    const sql = "SELECT * FROM users WHERE username = ?";
    const [rows] = await db.query(sql, [username]);
    return rows[0] || null;
  } catch (err) {
    console.error("❌ DB Find Error:", err.message);
    throw err;
  }
};
