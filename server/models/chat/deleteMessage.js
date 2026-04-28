const db = require("../../config/db");

/**
 * Soft delete a message
 */
module.exports = async (messageId) => {
  try {
    // SOFT DELETE: Update the message to a special string and clear attachments
    await db.query(
      "UPDATE chat_messages SET message = '[DELETED]', attachment = NULL WHERE id = ?",
      [messageId],
    );
    return true;
  } catch (error) {
    console.error("DB Error deleting message:", error);
    throw error;
  }
};
