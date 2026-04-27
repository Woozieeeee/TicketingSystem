const db = require("../../config/db");

/**
 * Get department heads
 */
module.exports = async (dept) => {
  try {
    const sql = "SELECT username FROM users WHERE dept = ? AND role = 'Head'";
    const [rows] = await db.query(sql, [dept]);
    return rows;
  } catch (err) {
    console.error("❌ Get Department Heads Error:", err.message);
    throw err;
  }
};
