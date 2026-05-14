const Ticket = require("../../models/ticket");
const chatModel = require("../../models/chat");
const toBool = require("./toBool");
const db = require("../../config/db");

/**
 * Update ticket
 * PUT /api/tickets/:id
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      status,
      userMarkedDone,
      headMarkedDone,
    } = req.body;

    // Get existing ticket
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Prepare update data
    const newTitle = title !== undefined ? title : ticket.title;
    const newDesc = description !== undefined ? description : ticket.description;
    const newCat = category !== undefined ? category : ticket.category;
    let newStatus = status !== undefined ? status : ticket.status;

    let isUserDone =
      userMarkedDone !== undefined
        ? toBool(userMarkedDone)
        : toBool(ticket.userMarkedDone);
    let isHeadDone =
      headMarkedDone !== undefined
        ? toBool(headMarkedDone)
        : toBool(ticket.headMarkedDone);

    // Reset done flags if status is PENDING
    if (newStatus === "PENDING") {
      isUserDone = false;
      isHeadDone = false;
    }

    // Only apply done flags logic if done flags are explicitly provided
    // Otherwise, respect the direct status update from frontend
    const doneFlagsProvided = userMarkedDone !== undefined || headMarkedDone !== undefined;
    
    if (doneFlagsProvided) {
      // Determine status based on done flags
      if (isUserDone && isHeadDone) {
        newStatus = "FINISHED";
      } else if (isUserDone || isHeadDone) {
        newStatus = "RESOLVED";
      } else if (newStatus !== "PENDING") {
        newStatus = "IN_PROGRESS";
      }
    }
    // If doneFlagsProvided is false, keep the status from req.body (direct status update)

    // Update ticket
    await Ticket.update(id, {
      title: newTitle,
      description: newDesc,
      category: newCat,
      status: newStatus,
      userMarkedDone: isUserDone,
      headMarkedDone: isHeadDone,
    });

    // Inject system message if status changed
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
      const sysMsg = statusMessages[newStatus] || `System: Ticket status updated to ${newStatus}`;

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
      //   io.emit("ticket_status_changed", { id, status: newStatus });
      //   io.emit("user_typing_lock", { ticketId: id, username: null });
      // }
    }

    // Log activity
    try {
      const actionType = newStatus !== ticket.status ? 'TICKET_STATUS_CHANGED' : 'TICKET_UPDATED';
      await db.query(
        `INSERT INTO activity_logs (username, action, resource, resource_id, details, ip_address, user_agent, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user?.username || 'unknown', actionType, 'TICKET', id, JSON.stringify({ oldStatus: ticket.status, newStatus, title: newTitle }), req.ip, req.get('User-Agent'), req.user?.role || 'User']
      );
    } catch (logErr) { /* silent */ }

    return res.status(200).json({
      success: true,
      message: "Updated Successfully",
    });
  } catch (error) {
    console.error("❌ Update Ticket Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};