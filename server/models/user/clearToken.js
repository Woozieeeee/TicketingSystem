const db = require("../../config/db");

/**
 * Clear user token (logout)
 */
module.exports = async (id) => {
  try {
    const sql = "UPDATE users SET auth_token = NULL, token_expires = NULL WHERE id = ?";
    await db.query(sql, [id]);
    return true;
  } catch (err) {
    console.error("❌ DB Clear Token Error:", err.message);
    throw err;
  }
};
