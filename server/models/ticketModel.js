const db = require("../config/db");

const Ticket = {
  getAll: async () => {
    try {
      // Changed to LEFT JOIN and added dept
      const sql = `
        SELECT t.*, u.username as createdBy, u.dept 
        FROM ticket t 
        LEFT JOIN user u ON t.userId = u.id 
        ORDER BY t.createdAt DESC
      `;
      // Use query instead of execute for better Pool performance
      const [rows] = await db.query(sql);
      return rows;
    } catch (err) {
      console.error("❌ Ticket Fetch Error:", err.message);
      throw err;
    }
  },

  create: async (ticketData) => {
    const { id, title, description, userId, category, status } = ticketData;
    try {
      const sql = `
        INSERT INTO ticket (id, title, description, status, userId, assignedToId, createdAt, updatedAt, category) 
        VALUES (?, ?, ?, ?, ?, NULL, NOW(), NOW(), ?)
      `;
      const [result] = await db.query(sql, [
        id,
        title,
        description,
        status || "PENDING",
        userId,
        category,
      ]);
      return result;
    } catch (err) {
      console.error("❌ Ticket Create Error:", err.message);
      throw err;
    }
  },

  findById: async (id) => {
    const [rows] = await db.query("SELECT * FROM ticket WHERE id = ?", [id]);
    return rows[0];
  },
};

module.exports = Ticket;
