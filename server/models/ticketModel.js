const db = require("../config/db");

const Ticket = {
  getAll: async () => {
    try {
      // Changed to LEFT JOIN and added dept
      const sql = `
        SELECT t.*, u.username as createdBy, u.dept 
        FROM tickets t 
        LEFT JOIN users u ON t.userId = u.id 
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
        INSERT INTO tickets (id, title, description, status, userId, assignedToId, createdAt, updatedAt, category) 
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
    const [rows] = await db.query("SELECT * FROM tickets WHERE id = ?", [id]);
    return rows[0];
  },

  getTicketsForUser: async (username) => {
    try {
      const sql = `
        SELECT t.*, u.username as createdBy, u.dept 
        FROM tickets t 
        LEFT JOIN users u ON t.userId = u.id 
        WHERE u.username = ?
        ORDER BY t.createdAt DESC
      `;
      const [rows] = await db.query(sql, [username]);
      return rows;
    } catch (err) {
      console.error("❌ Get Tickets For User Error:", err.message);
      throw err;
    }
  },

  getTicketById: async (id) => {
    try {
      const [rows] = await db.query("SELECT * FROM tickets WHERE id = ?", [id]);
      return rows[0];
    } catch (err) {
      console.error("❌ Get Ticket By ID Error:", err.message);
      throw err;
    }
  },

  updateTicketStatus: async (id, status) => {
    try {
      const [result] = await db.query(
        "UPDATE tickets SET status = ?, updatedAt = NOW() WHERE id = ?",
        [status, id]
      );
      return result;
    } catch (err) {
      console.error("❌ Update Ticket Status Error:", err.message);
      throw err;
    }
  },

  createActivityLog: async (ticketId, message) => {
    try {
      const [result] = await db.query(
        "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'review', 0, NOW(), NOW())",
        ['System', message, ticketId]
      );
      return result;
    } catch (err) {
      console.error("❌ Create Activity Log Error:", err.message);
      throw err;
    }
  },
};

module.exports = Ticket;
