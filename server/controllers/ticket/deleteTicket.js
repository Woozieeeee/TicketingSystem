const db = require("../../config/db");

const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT * FROM tickets WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    await db.query("DELETE FROM chat_messages WHERE ticketId = ?", [id]);
    await db.query("DELETE FROM notifications WHERE ticketGlobalId = ?", [id]);
    await db.query("DELETE FROM tickets WHERE id = ?", [id]);

    const io = req.app.get("io");
    if (io) {
      io.emit("ticket_status_changed", { id, action: "deleted" });
    }

    return res.status(200).json({ success: true, message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = deleteTicket;