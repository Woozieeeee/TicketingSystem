const Ticket = require("../../models/ticket");
const Notification = require("../../models/notification");
const db = require("../../config/db");

/**
 * Create a new ticket
 * POST /api/tickets
 */
module.exports = async (req, res) => {
  try {
    const { title, description, category, createdBy, dept, date } = req.body;
    const id = `t_${Date.now()}`;

    // Create ticket
    await Ticket.create({
      id,
      title,
      description,
      category,
      createdBy,
      dept,
      date,
    });

    // Notify department heads
    const heads = await Ticket.getDepartmentHeads(dept);
    for (const head of heads) {
      await Notification.create({
        username: head.username,
        message: `New ticket created by ${createdBy} in ${dept}: "${title}"`,
        ticketGlobalId: id,
        type: "new_ticket",
      });
    }

    // Real-time trigger
    const io = req.app.get("io");
    if (io) {
      io.emit("ticket_status_changed", {
        id,
        status: "PENDING",
        username: createdBy,
      });
    }

    // Log activity
    try {
      await db.query(
        `INSERT INTO activity_logs (username, action, resource, resource_id, details, ip_address, user_agent, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [createdBy, 'TICKET_CREATED', 'TICKET', id, JSON.stringify({ title, category, dept }), req.ip, req.get('User-Agent'), req.user?.role || 'User']
      );
    } catch (logErr) { /* silent */ }

    return res.status(201).json({
      success: true,
      message: "Ticket Created",
      id,
    });
  } catch (error) {
    console.error("❌ Create Ticket Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
