const db = require("../../config/db");

/**
 * Find all users by department
 */
module.exports = async (dept) => {
  try {
    const sql = "SELECT id, username, role FROM users WHERE dept = ?";
    const [rows] = await db.query(sql, [dept]);
    return rows;
  } catch (err) {
    console.error("❌ DB FindByDept Error:", err.message);
    throw err;
  }
};
