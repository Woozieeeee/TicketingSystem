const db = require("../../config/db");
const bcrypt = require("bcrypt");

/**
 * Create a new user
 */
module.exports = async (userData) => {
  const { id, username, password, role, dept } = userData;
  try {
    // If no password provided, use default password
    const defaultPassword = password || "ChangeMe123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const sql = `INSERT INTO users (id, username, password, role, dept, password_change_required) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      id,
      username,
      hashedPassword,
      role,
      dept,
      1, // password_change_required defaults to 1 (true)
    ]);
    return result;
  } catch (err) {
    console.error("❌ DB Create Error:", err.message);
    throw err;
  }
};
