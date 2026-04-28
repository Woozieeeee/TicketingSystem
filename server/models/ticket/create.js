const db = require("../../config/db");

/**
 * Create a new ticket
 */
module.exports = async (ticketData) => {
  const { id, title, description, category, createdBy, dept, date } = ticketData;
  try {
    const sql = `
      INSERT INTO tickets (id, title, description, category, status, createdBy, dept, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await db.query(sql, [
      id,
      title,
      description,
      category,
      createdBy,
      dept,
      date,
    ]);
    return result;
  } catch (err) {
    console.error("❌ Ticket Create Error:", err.message);
    throw err;
  }
};
