const db = require("../../config/db");

/**
 * Find user by ID
 */
module.exports = async (id) => {
  try {
    const sql = "SELECT * FROM users WHERE id = ?";
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  } catch (err) {
    console.error("❌ DB FindById Error:", err.message);
    throw err;
  }
};
