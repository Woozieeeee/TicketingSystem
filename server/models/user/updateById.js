const db = require("../../config/db");

/**
 * Update user by ID
 */
module.exports = async (id, userData) => {
  const { username, role, dept } = userData;
  try {
    const sql = "UPDATE users SET username = ?, role = ?, dept = ? WHERE id = ?";
    const [result] = await db.query(sql, [username, role, dept, id]);
    return result;
  } catch (err) {
    console.error("❌ DB Update User Error:", err.message);
    throw err;
  }
};
