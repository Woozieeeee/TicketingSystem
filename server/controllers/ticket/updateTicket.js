const Ticket = require("../../models/ticket");
const chatModel = require("../../models/chat");
const toBool = require("./toBool");
const activity = require("../../lib/activityLogger");

/**
 * Update ticket
 * PUT /api/tickets/:id
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, status, userMarkedDone, headMarkedDone } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const newTitle = title !== undefined ? title : ticket.title;
    const newDesc = description !== undefined ? description : ticket.description;
    const newCat = category !== undefined ? category : ticket.category;
    let newStatus = status !== undefined ? status : ticket.status;

    let isUserDone =
      userMarkedDone !== undefined ? toBool(userMarkedDone) : toBool(ticket.userMarkedDone);
    let isHeadDone =
      headMarkedDone !== undefined ? toBool(headMarkedDone) : toBool(ticket.headMarkedDone);

    if (newStatus === "PENDING") {
      isUserDone = false;
      isHeadDone = false;
    }

    const doneFlagsProvided = userMarkedDone !== undefined || headMarkedDone !== undefined;

    if (doneFlagsProvided) {
      if (isUserDone && isHeadDone) {
        newStatus = "FINISHED";
      } else if (isUserDone || isHeadDone) {
        newStatus = "RESOLVED";
      } else if (newStatus !== "PENDING") {
        newStatus = "IN_PROGRESS";
      }
    }

    await Ticket.update(id, {
      title: newTitle,
      description: newDesc,
      category: newCat,
      status: newStatus,
      userMarkedDone: isUserDone,
      headMarkedDone: isHeadDone,
    });

    if (newStatus !== ticket.status) {
      const statusMessages = {
        IN_PROGRESS:
          "⚙️ Status Update: The support team is now actively working on this ticket.",
        RESOLVED:
          "✅ Status Update: This ticket has been marked as Resolved. Please confirm if the issue is fully fixed.",
        FINISHED:
          "🔒 Status Update: This ticket has been permanently closed. Thank you for your cooperation!",
        PENDING:
          "⏳ Status Update: This ticket has been moved back to Pending.",
      };
      const sysMsg =
        statusMessages[newStatus] || `System: Ticket status updated to ${newStatus}`;

      const chatId = await chatModel.saveSystemMessage(id, sysMsg);

      const io = req.app.get("io");
      if (io) {
        io.to(id).emit("receive_message", {
          id: chatId,
          ticketId: id,
          sender: "System",
          message: sysMsg,
          created_at: new Date(),
        });
        io.emit("ticket_status_changed", { id, status: newStatus });
        io.emit("user_typing_lock", { ticketId: id, username: null });
      }

      await activity.ticketStatusChanged(req, {
        id,
        title: newTitle,
        oldStatus: ticket.status,
        newStatus,
      });
    } else {
      await activity.ticketUpdated(req, { id, title: newTitle });
    }

    return res.status(200).json({ success: true, message: "Updated Successfully" });
  } catch (error) {
    console.error("Update Ticket Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
