const db = require("../../config/db");

/**
 * Get all tickets (basic)
 */
module.exports = async () => {
  try {
    const sql = `
      SELECT t.*
      FROM tickets t 
      ORDER BY t.date DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    console.error("❌ Ticket Fetch Error:", err.message);
    throw err;
  }
};
