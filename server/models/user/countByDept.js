const db = require("../../config/db");

/**
 * Count users in a department (for role assignment)
 */
module.exports = async (dept) => {
  try {
    const sql = "SELECT COUNT(*) as count FROM users WHERE dept = ?";
    const [rows] = await db.query(sql, [dept]);
    return rows[0].count;
  } catch (err) {
    console.error("❌ DB CountByDept Error:", err.message);
    throw err;
  }
};
