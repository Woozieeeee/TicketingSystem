const db = require("../../config/db");

/**
 * Delete a notification
 */
module.exports = async (id) => {
  try {
    const sql = "DELETE FROM notifications WHERE id = ?";
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error("❌ DB Delete Notification Error:", err.message);
    throw err;
  }
};
