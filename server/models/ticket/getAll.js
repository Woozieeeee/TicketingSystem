const db = require("../../config/db");

/**
 * Get all tickets (basic)
 */
module.exports = async () => {
  try {
    const sql = `
      SELECT t.*, u.username as createdBy, u.dept 
      FROM tickets t 
      LEFT JOIN users u ON t.userId = u.id 
      ORDER BY t.createdAt DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    console.error("❌ Ticket Fetch Error:", err.message);
    throw err;
  }
};
