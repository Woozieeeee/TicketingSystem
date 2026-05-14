const Ticket = require("../../models/ticket");
const Notification = require("../../models/notification");
const activity = require("../../lib/activityLogger");

/**
 * Create a new ticket
 * POST /api/tickets
 */
module.exports = async (req, res) => {
  try {
    const { title, description, category, createdBy, dept, date } = req.body;
    const id = `t_${Date.now()}`;

    await Ticket.create({ id, title, description, category, createdBy, dept, date });

    const heads = await Ticket.getDepartmentHeads(dept);
    for (const head of heads) {
      await Notification.create({
        username: head.username,
        message: `New ticket created by ${createdBy} in ${dept}: "${title}"`,
        ticketGlobalId: id,
        type: "new_ticket",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("ticket_status_changed", { id, status: "PENDING", username: createdBy });
    }

    await activity.ticketCreated(req, { id, title, category, dept, createdBy });

    return res.status(201).json({ success: true, message: "Ticket Created", id });
  } catch (error) {
    console.error("Create Ticket Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
