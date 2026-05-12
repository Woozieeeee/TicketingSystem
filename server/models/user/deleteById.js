const db = require("../../config/db");

/**
 * Delete user by ID
 */
module.exports = async (id) => {
  try {
    const sql = "DELETE FROM users WHERE id = ?";
    const [result] = await db.query(sql, [id]);
    return result;
  } catch (err) {
    console.error("❌ DB Delete User Error:", err.message);
    throw err;
  }
};
