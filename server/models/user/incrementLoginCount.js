const db = require("../../config/db");

/**
 * Increment login count for a user
 */
module.exports = async (id) => {
  try {
    const sql = "UPDATE users SET login_count = login_count + 1 WHERE id = ?";
    await db.query(sql, [id]);
    return true;
  } catch (err) {
    console.error("❌ DB Increment Login Count Error:", err.message);
    throw err;
  }
};
