const db = require("../../config/db");

/**
 * Get all users
 */
module.exports = async () => {
  try {
    const sql = 'SELECT id, username, role, dept, login_count, COALESCE(status, "Active") AS status FROM users ORDER BY username';
    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      const [rows] = await db.query(
        'SELECT id, username, role, dept, login_count, "Active" AS status FROM users ORDER BY username'
      );
      return rows;
    }
    console.error("❌ DB Get All Users Error:", err.message);
    throw err;
  }
};
