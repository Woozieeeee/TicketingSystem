const db = require("../../config/db");

/**
 * Update user by ID
 */
module.exports = async (id, userData) => {
  const { username, role, dept, password, password_change_required } = userData;
  try {
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }
    if (dept !== undefined) {
      updates.push("dept = ?");
      values.push(dept);
    }
    if (password !== undefined) {
      updates.push("password = ?");
      values.push(password);
    }
    if (password_change_required !== undefined) {
      updates.push("password_change_required = ?");
      values.push(password_change_required);
    }

    if (updates.length === 0) {
      return { affectedRows: 0 };
    }

    values.push(id);
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    const [result] = await db.query(sql, values);
    return result;
  } catch (err) {
    console.error("❌ DB Update User Error:", err.message);
    throw err;
  }
};
