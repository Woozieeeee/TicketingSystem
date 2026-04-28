const Ticket = require("../../models/ticket");

/**
 * Get single ticket by ID
 * GET /api/tickets/:id
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Ticket ID is required" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error("❌ Get Ticket Error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};
