// server/models/user/findHeadsByDept.js
const db = require("../../config/db");

/**
 * Maghanap ng lahat ng users na 'Head' ang role sa isang department
 */
module.exports = async (dept) => {
  try {
    const sql = "SELECT username FROM users WHERE dept = ? AND role = 'Head'";
    const [rows] = await db.query(sql, [dept]);
    return rows; // Magbabalik ito ng array (hal. [{username: 'admin1'}, {username: 'admin2'}])
  } catch (err) {
    console.error("❌ DB Find Heads Error:", err.message);
    throw err;
  }
};