const db = require("../config/db");

const User = {
  create: async (id, username, password, role, dept) => {
    try {
      const sql = `INSERT INTO users (id, username, password, role, dept) VALUES (?, ?, ?, ?, ?)`;
      // Use db.query for better compatibility with pools
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
      throw err; // Send error to controller
    }
  },

  findByUsername: async (username) => {
    try {
      const sql = "SELECT * FROM users WHERE username = ?";
      const [rows] = await db.query(sql, [username]);
      return rows[0]; // Returns the user if found, or undefined
    } catch (err) {
      console.error("❌ DB Find Error:", err.message);
      throw err;
    }
  },
};

module.exports = User;
