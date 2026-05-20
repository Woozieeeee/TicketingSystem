const Ticket = require("../../models/ticket");
const chatModel = require("../../models/chat");
const User = require("../../models/user");
const Notification = require("../../models/notification");
const toBool = require("./toBool");

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
        FOLLOW_UP:
          "📋 Status Update: This ticket requires follow-up. Please check for additional information.",
      };
      const sysMsg = statusMessages[newStatus] || `System: Ticket status updated to ${newStatus}`;

      const chatId = await chatModel.saveSystemMessage(id, sysMsg);

      // Create notification for the ticket creator
     try {
        // 1. Kunin ang username mula sa 'createdBy' (Base sa console log mo, ito ang meron)
        const creatorUsername = ticket.createdBy; 
        
        console.log("🔍 Debug: Searching for creator using username:", creatorUsername);

        // 2. Gamitin ang findByUsername model
        const ticketCreator = await User.findByUsername(creatorUsername);
        if (ticketCreator) {
          const notificationMessages = {
            IN_PROGRESS: `Your ticket "${ticket.title}" is now IN PROGRESS. The support team is working on it.`,
            RESOLVED: `Your ticket "${ticket.title}" has been RESOLVED. Please confirm if the issue is fixed.`,
            FINISHED: `Your ticket "${ticket.title}" has been FINISHED and closed. Thank you!`,
            PENDING: `Your ticket "${ticket.title}" is back to PENDING status.`,
            FOLLOW_UP: `Your ticket "${ticket.title}" requires FOLLOW-UP. Please check for updates.`,
          };
          
          await Notification.create({
            username: ticketCreator.username,
            message: notificationMessages[newStatus] || `Your ticket "${ticket.title}" status changed to ${newStatus}`,
            ticketGlobalId: id,
            type: "ticket_status_change",
          });
          console.log(`✅ Success: Notification sent to ${ticketCreator.username}`);
        } else {
          console.log(`❌ Error: User "${creatorUsername}" not found in database.`);
        }
      } catch (notifErr) {
        console.error("⚠️ Notification Error:", notifErr.message);
      }

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
