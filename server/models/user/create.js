const db = require("../../config/db");

/**
 * Create a new user
 */
module.exports = async (userData) => {
  const { id, username, password, role, dept } = userData;
  try {
    const sql = `INSERT INTO users (id, username, password, role, dept) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      id,
      username,
      password,
      role,
      dept,
    ]);
    return result;
  } catch (err) {
    console.error("❌ DB Create Error:", err.message);
    throw err;
  }
};
