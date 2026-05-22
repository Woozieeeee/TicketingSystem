const db = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
  // Get all users (Isinama ang created_at para sa joinedDate ng frontend mo)
  getAll: async () => {
    try {
      const [rows] = await db.query(
        'SELECT id, username, email, role, dept, login_count, created_at, COALESCE(status, "Active") AS status FROM users ORDER BY username'
      );
      return rows;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback kung wala pang created_at o status columns sa physical schema
        const [rows] = await db.query(
          'SELECT id, username, role, dept, login_count, "Active" AS status FROM users ORDER BY username'
        );
        return rows;
      }
      console.error('❌ Get All Users Error:', err.message);
      throw err;
    }
  },

  // Get user by ID (Inayos para maging kumpleto ang ibinabalik na data sa controller)
  findById: async (id) => {
    try {
      const [rows] = await db.query(
        'SELECT id, username, email, role, dept, login_count, created_at, COALESCE(status, "Active") AS status FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Find User By ID Error:', err.message);
      throw err;
    }
  },

  // Get user by username (Para sa Auth/Login verification system)
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

  // 🟢 DAGDAG: Find Department Heads (Para iwas crash sa registerController pipeline)
  findHeadsByDept: async (dept) => {
    try {
      const [rows] = await db.query(
        "SELECT * FROM users WHERE dept = ? AND role = 'Head'",
        [dept]
      );
      return rows; // Nagbabalik ng array ng users na Head sa department na 'yan
    } catch (err) {
      console.error('❌ Find Heads By Dept Error:', err.message);
      throw err;
    }
  },

  // Create new user (Tinanggal ang double-hashing bug)
  create: async (userData) => {
    try {
      const { id, username, password, role, dept } = userData;
      
      // FIX: Ang password ay pre-hashed na mula sa controller para iwas corrupt data encryption.
      // Sasaluin na lang natin nang diretso kung may value, kung wala ay saka lang magse-secure fall-back.
      let finalPassword = password;
      if (password && !password.startsWith('$2b$')) { 
        finalPassword = await bcrypt.hash(password, 10);
      }
      
      const [result] = await db.query(
        'INSERT INTO users (id, username, password, role, dept, login_count, status) VALUES (?, ?, ?, ?, ?, 0, "Pending")',
        [id, username, finalPassword, role, dept || 'General']
      );
      
      return result;
    } catch (err) {
      console.error('❌ Create User Error:', err.message);
      throw err;
    }
  },

  // Update user details by ID
  updateById: async (id, userData) => {
    try {
      const { username, role, dept, password } = userData;
      
      // Kung may pinadalang bagong password mula sa modal handler
      if (password) {
        const [result] = await db.query(
          'UPDATE users SET username = ?, role = ?, dept = ?, password = ? WHERE id = ?',
          [username, role, dept || 'General', password, id]
        );
        return result;
      }
      
      // Normal data updates kung walang binago sa password
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

  // Update user status (Suspended/Active tags toggling handler)
  updateStatus: async (id, status) => {
    try {
      const [result] = await db.query(
        'UPDATE users SET status = ? WHERE id = ?',
        [status, id]
      );
      return result;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        throw new Error('STATUS_COLUMN_MISSING');
      }
      console.error('❌ Update User Status Error:', err.message);
      throw err;
    }
  },

  // Delete user account by ID
  deleteById: async (id) => {
    try {
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
      return result;
    } catch (err) {
      console.error('❌ Delete User Error:', err.message);
      throw err;
    }
  },

  // Verify safe login verification credentials
  verifyPassword: async (plainPassword, hashedPassword) => {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
      console.error('❌ Password Verification Error:', err.message);
      throw err;
    }
  },

  // Find user via secure active cookies session validation tokens
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

  // Update validation timestamp configurations
  updateToken: async (userId, token, expires) => {
    try {
      const tokenExpires = expires || new Date(Date.now() + 60 * 60 * 1000); // Use provided expires or default to 1 hour
      const [result] = await db.query(
        'UPDATE users SET auth_token = ?, token_expires = ? WHERE id = ?',
        [token, tokenExpires, userId]
      );
      return result;
    } catch (err) {
      console.error('❌ Update Token Error:', err.message);
      throw err;
    }
  },

  // Auto increment user activities triggers counters
  incrementLoginCount: async (userId) => {
    try {
      const [result] = await db.query(
        'UPDATE users SET login_count = login_count + 1 WHERE id = ?',
        [userId]
      );
      return result;
    } catch (err) {
      console.error('❌ Increment Login Count Error:', err.message);
      throw err;
    }
  },

  // Group metadata tracker indicators
  countByDept: async (dept) => {
    try {
      const [result] = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE dept = ?',
        [dept]
      );
      return result[0].count;
    } catch (err) {
      console.error('❌ Count By Dept Error:', err.message);
      throw err;
    }
  }
};

module.exports = User;