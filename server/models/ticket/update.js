const db = require("../../config/db");

/**
 * Update ticket details
 */
module.exports = async (id, updateData) => {
  const {
    title,
    description,
    category,
    status,
    userMarkedDone,
    headMarkedDone,
  } = updateData;
  try {
    const sql = `
      UPDATE tickets 
      SET title = ?, description = ?, category = ?, status = ?, 
          userMarkedDone = ?, headMarkedDone = ?, updatedAt = NOW() 
      WHERE id = ?
    `;
    const [result] = await db.query(sql, [
      title,
      description,
      category,
      status,
      userMarkedDone ? 1 : 0,
      headMarkedDone ? 1 : 0,
      id,
    ]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error("❌ Ticket Update Error:", err.message);
    throw err;
  }
};
