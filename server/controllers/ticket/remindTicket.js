const Ticket = require("../../models/ticket");
const Notification = require("../../models/notification");
const chatModel = require("../../models/chat");

/**
 * Send reminder for ticket
 * PUT /api/tickets/:id/remind
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Update reminder status
    await Ticket.updateReminderStatus(id, true);

    // Get ticket details
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Notify department heads
    const heads = await Ticket.getDepartmentHeads(ticket.dept);
    for (const head of heads) {
      await Notification.create({
        username: head.username,
        message: `URGENT NUDGE: ${ticket.createdBy} is asking for an update on "${ticket.title}"`,
        ticketGlobalId: id,
        type: "reminder",
      });
    }

    // Inject system message
    const sysMsg = `SYS_REMINDER|${ticket.createdBy}`;
    const chatId = await chatModel.saveSystemMessage(id, sysMsg);

    // [SOCKET.IO DISABLED] Using HTTP polling instead
    // Real-time emit
    // const io = req.app.get("io");
    // if (io) {
    //   io.to(id).emit("receive_message", {
    //     id: chatId,
    //     ticketId: id,
    //     sender: "System",
    //     message: sysMsg,
    //     created_at: new Date(),
    //   });
    //   io.emit("ticket_status_changed", {
    //     id,
    //     action: "remind",
    //     reminder_flag: 1,
    //   });
    // }

    return res.status(200).json({
      success: true,
      message: "Reminder sent",
    });
  } catch (error) {
    console.error("❌ Remind Ticket Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
