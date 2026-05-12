const db = require("../../config/db");

/**
 * Get all users
 */
module.exports = async () => {
  try {
    const sql = "SELECT id, username, role, dept, login_count FROM users ORDER BY username";
    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    console.error("❌ DB Get All Users Error:", err.message);
    throw err;
  }
};
