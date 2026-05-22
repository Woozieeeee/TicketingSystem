const Ticket = require("../../models/ticket");

/**
 * Get all tickets with role-based filtering and unread counts
 * GET /api/tickets
 */
module.exports = async (req, res) => {
  try {
    // Use authenticated user info from middleware instead of query params
    const user = req.user;
    let results = [];

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (user.role === "Head" && user.dept) {
      results = await Ticket.getTicketsForHead(user.dept);
    } else if (user.role === "User" && user.username) {
      results = await Ticket.getTicketsForUser(user.username);
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
