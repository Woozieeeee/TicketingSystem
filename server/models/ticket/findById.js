const db = require("../../config/db");

/**
 * Find ticket by ID
 */
module.exports = async (id) => {
  try {
    const [rows] = await db.query("SELECT * FROM tickets WHERE id = ?", [id]);
    return rows[0] || null;
  } catch (err) {
    console.error("❌ Ticket Find Error:", err.message);
    throw err;
  }
};
