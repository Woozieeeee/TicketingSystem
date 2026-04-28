const Ticket = require("../../models/ticket");

/**
 * Get all tickets with role-based filtering and unread counts
 * GET /api/tickets
 */
module.exports = async (req, res) => {
  try {
    const { role, dept, username } = req.query;
    let results = [];

    if (role === "Head" && dept) {
      results = await Ticket.getTicketsForHead(dept);
    } else if (role === "User" && username) {
      results = await Ticket.getTicketsForUser(username);
    } else {
      results = await Ticket.getAll();
    }

    return res.status(200).json(results || []);
  } catch (error) {
    console.error("❌ Get Tickets Error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};
