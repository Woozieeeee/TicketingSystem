const Notification = require("../../models/notification");
const Ticket = require("../../models/ticket");

/**
 * Send reminder for a ticket to department heads
 * PUT /api/tickets/:id/remind
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Update ticket reminder status
    await Ticket.updateReminderStatus(id, true);

    // Get ticket details
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Create reminder notifications for department heads
    const notifications = await Notification.createReminder(
      ticket.id,
      ticket.title,
      ticket.dept,
      ticket.createdBy
    );

    return res.status(200).json({
      success: true,
      message: "Reminder sent to Head",
      notificationsCreated: notifications.length,
    });
  } catch (error) {
    console.error("❌ Remind Ticket Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
