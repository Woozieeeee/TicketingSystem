const db = require("../../config/db");

/**
 * Update user token
 */
module.exports = async (id, token, expires) => {
  try {
    const sql = "UPDATE users SET auth_token = ?, token_expires = ? WHERE id = ?";
    await db.query(sql, [token, expires, id]);
    return true;
  } catch (err) {
    console.error("❌ DB Update Token Error:", err.message);
    throw err;
  }
};
