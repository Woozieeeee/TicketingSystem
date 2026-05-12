const db = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
  // Get all users (excluding password)
  getAll: async () => {
    try {
      const [rows] = await db.query(
        'SELECT id, username, role, dept, login_count FROM users ORDER BY username'
      );
      return rows;
    } catch (err) {
      console.error('❌ Get All Users Error:', err.message);
      throw err;
    }
  },

  // Get user by ID (excluding password)
  findById: async (id) => {
    try {
      const [rows] = await db.query(
        'SELECT id, username, role, dept, login_count FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Find User By ID Error:', err.message);
      throw err;
    }
  },

  // Get user by username (including password for authentication)
  findByUsername: async (username) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Find User By Username Error:', err.message);
      throw err;
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const { id, username, password, role, dept } = userData;
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await db.query(
        'INSERT INTO users (id, username, password, role, dept, login_count) VALUES (?, ?, ?, ?, ?, 0)',
        [id, username, hashedPassword, role, dept || 'General']
      );
      
      return result;
    } catch (err) {
      console.error('❌ Create User Error:', err.message);
      throw err;
    }
  },

  // Update user by ID
  updateById: async (id, userData) => {
    try {
      const { username, role, dept } = userData;
      const [result] = await db.query(
        'UPDATE users SET username = ?, role = ?, dept = ? WHERE id = ?',
        [username, role, dept || 'General', id]
      );
      return result;
    } catch (err) {
      console.error('❌ Update User Error:', err.message);
      throw err;
    }
  },

  // Update user status (for suspend/activate)
  updateStatus: async (id, status) => {
    try {
      const [result] = await db.query(
        'UPDATE users SET status = ? WHERE id = ?',
        [status, id]
      );
      return result;
    } catch (err) {
      console.error('❌ Update User Status Error:', err.message);
      throw err;
    }
  },

  // Delete user by ID
  deleteById: async (id) => {
    try {
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
      return result;
    } catch (err) {
      console.error('❌ Delete User Error:', err.message);
      throw err;
    }
  },

  // Verify password for login
  verifyPassword: async (plainPassword, hashedPassword) => {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
      console.error('❌ Password Verification Error:', err.message);
      throw err;
    }
  },

  // Find user by auth token
  findByToken: async (token) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE auth_token = ? AND token_expires > NOW()',
        [token]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Find User By Token Error:', err.message);
      throw err;
    }
  },

  // Update auth token for user
  updateToken: async (userId, token) => {
    try {
      const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      const [result] = await db.query(
        'UPDATE users SET auth_token = ?, token_expires = ? WHERE id = ?',
        [token, tokenExpires, userId]
      );
      return result;
    } catch (err) {
      console.error('❌ Update Token Error:', err.message);
      throw err;
    }
  }
};

module.exports = User;
