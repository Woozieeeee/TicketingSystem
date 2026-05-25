// server/controllers/ticketController.js
const db = require("../config/db");

// Helper to safely parse booleans
const toBool = (val) =>
  val === true || val === "true" || val === 1 || val === "1";

// GET all tickets with filtering and UNREAD COUNTS
exports.getTickets = async (req, res) => {
  try {
    const { role, dept, username } = req.query;
    let query = "";
    const params = [];

    if (role === "Head" && dept) {
      query = `
        SELECT t.*, 
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.ticketId = t.id AND cm.sender != 'Support Admin' AND cm.is_read = 0) AS unreadCount 
        FROM tickets t WHERE t.dept = ? ORDER BY t.date DESC
      `;
      params.push(dept);
    } else if (role === "User" && username) {
      query = `
        SELECT t.*, 
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.ticketId = t.id AND cm.sender != ? AND cm.is_read = 0) AS unreadCount 
        FROM tickets t WHERE t.createdBy = ? ORDER BY t.date DESC
      `;
      params.push(username, username);
    } else {
      query = "SELECT * FROM tickets ORDER BY date DESC";
    }

    const [results] = await db.query(query, params);
    return res.status(200).json(results || []);
  } catch (error) {
    console.error("Server error in getTickets:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
};

// CREATE a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, createdBy, dept, date } = req.body;
    const id = `t_${Date.now()}`;

    const query = `
      INSERT INTO tickets (id, title, description, category, status, createdBy, dept, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, NOW(), NOW())
    `;

    await db.query(query, [
      id,
      title,
      description,
      category,
      createdBy,
      dept,
      date,
    ]);

    const [headRows] = await db.query(
      "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
      [dept],
    );

    for (const head of headRows) {
      const message = `New ticket created by ${createdBy} in ${dept}: "${title}"`;
      const notifQuery = `
        INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at)
        VALUES (?, ?, ?, 'new_ticket', 0, NOW(), NOW())
      `;
      await db.query(notifQuery, [head.username, message, id]);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("ticket_status_changed", {
        id: id,
        status: "PENDING",
        username: createdBy,
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Ticket Created", id });
  } catch (error) {
    console.error("❌ Create Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET single ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Ticket ID is required" });

    const [results] = await db.query("SELECT * FROM tickets WHERE id = ?", [
      id,
    ]);
    if (results.length === 0)
      return res.status(404).json({ error: "Ticket not found" });

    return res.status(200).json(results[0]);
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
};

// UPDATE TICKET
exports.updateTicket = async (req, res) => {
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

    const [existing] = await db.query("SELECT * FROM tickets WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ error: "Ticket not found" });

    const ticket = existing[0];
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

    if (newStatus === "PENDING" || newStatus === "Pending") {
      isUserDone = false;
      isHeadDone = false;
    }

    const doneFlagsProvided = userMarkedDone !== undefined || headMarkedDone !== undefined;
    
    if (doneFlagsProvided) {
      if (isUserDone && isHeadDone) {
        newStatus = "FINISHED";
      } else if (isUserDone || isHeadDone) {
        newStatus = "RESOLVED";
      } else if (newStatus !== "PENDING" && newStatus !== "Pending") {
        newStatus = "IN_PROGRESS";
      }
    }

    const finalUserMarked = isUserDone ? 1 : 0;
    const finalHeadMarked = isHeadDone ? 1 : 0;

    const query = `
      UPDATE tickets 
      SET title = ?, description = ?, category = ?, status = ?, userMarkedDone = ?, headMarkedDone = ?, updatedAt = NOW() 
      WHERE id = ?
    `;
    await db.query(query, [
      newTitle,
      newDesc,
      newCat,
      newStatus.toUpperCase(),
      finalUserMarked,
      finalHeadMarked,
      id,
    ]);

    if (newStatus.toUpperCase() !== ticket.status.toUpperCase()) {
      let sysMsg = "";
      switch (newStatus.toUpperCase()) {
        case "IN_PROGRESS":
          sysMsg = "⚙️ Status Update: The support team is now actively working on this ticket.";
          break;
        case "RESOLVED":
          sysMsg = "✅ Status Update: This ticket has been marked as Resolved. Please confirm if the issue is fully fixed.";
          break;
        case "FINISHED":
          sysMsg = "🔒 Status Update: This ticket has been permanently closed. Thank you for your cooperation!";
          break;
        case "PENDING":
          sysMsg = "⏳ Status Update: This ticket has been moved back to Pending.";
          break;
        default:
          sysMsg = `System: Ticket status updated to ${newStatus}`;
      }

      const [chatRes] = await db.query(
        "INSERT INTO chat_messages (ticketId, sender, message, created_at, is_read) VALUES (?, 'System', ?, NOW(), 0)",
        [id, sysMsg],
      );

      const io = req.app.get("io");
      if (io) {
        io.to(id).emit("receive_message", {
          id: chatRes.insertId,
          ticketId: id,
          sender: "System",
          message: sysMsg,
          created_at: new Date(),
        });
        io.emit("ticket_status_changed", { id, status: newStatus.toUpperCase() });
        io.emit("user_typing_lock", { ticketId: id, username: null });
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Updated Successfully" });
  } catch (error) {
    console.error("❌ Update Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// REMIND TICKET
exports.remindTicket = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE tickets SET reminder_flag = 1, last_reminded_at = NOW() WHERE id = ?",
      [id],
    );

    const [ticketRows] = await db.query(
      "SELECT title, dept, createdBy FROM tickets WHERE id = ?",
      [id],
    );

    if (ticketRows.length > 0) {
      const ticket = ticketRows[0];
      const [headRows] = await db.query(
        "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
        [ticket.dept],
      );

      for (const head of headRows) {
        const message = `URGENT NUDGE: ${ticket.createdBy} is asking for an update on "${ticket.title}"`;
        await db.query(
          "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'reminder', 0, NOW(), NOW())",
          [head.username, message, id],
        );
      }

      const sysMsg = `SYS_REMINDER|${ticket.createdBy}`;
      const [chatRes] = await db.query(
        "INSERT INTO chat_messages (ticketId, sender, message, created_at, is_read) VALUES (?, 'System', ?, NOW(), 0)",
        [id, sysMsg],
      );

      const io = req.app.get("io");
      if (io) {
        io.to(id).emit("receive_message", {
          id: chatRes.insertId,
          ticketId: id,
          sender: "System",
          message: sysMsg,
          created_at: new Date(),
        });
        io.emit("ticket_status_changed", {
          id,
          action: "remind",
          reminder_flag: 1,
        });
      }
    }
    return res.status(200).json({ success: true, message: "Reminder sent" });
  } catch (error) {
    console.error("❌ Remind Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE TICKET
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    // Ginamit ang direktang db.query para pareho sa pattern ng buong file mo
    await db.query("DELETE FROM tickets WHERE id = ?", [id]);
    return res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==========================================
// GOOGLE FORM WEBHOOK CONTROLLER (NEW CODE)
// ==========================================
exports.handleGoogleFormWebhook = async (req, res) => {
  const { ticket_number, userMarkedDone } = req.body;

  if (!ticket_number) {
    return res.status(400).json({ success: false, message: "Missing ticket_number" });
  }

  try {
    // 1. Hanapin muna ang ticket gamit ang ticket_number o id (globalId) para makuha ang system id nito
    const [rows] = await db.query(
      "SELECT id, status, headMarkedDone FROM tickets WHERE ticket_number = ? OR id = ?",
      [ticket_number, ticket_number]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const targetTicket = rows[0];
    const ticketId = targetTicket.id;

    // 2. Alamin kung kailangang mag-escalate ang status sa FINISHED (Kapag si Head ay nag-click na rin ng Finish)
    let finalStatus = "RESOLVED";
    if (toBool(targetTicket.headMarkedDone)) {
      finalStatus = "FINISHED";
    }

    // 3. I-update ang flags at status sa MySQL Database
    const updateQuery = `
      UPDATE tickets 
      SET userMarkedDone = 1, status = ?, updatedAt = NOW() 
      WHERE id = ?
    `;
    await db.query(updateQuery, [finalStatus, ticketId]);

    // 4. Mag-inject ng System Message sa chat para alam ng dalawang panig na may review na naganap
    const sysMsg = "📝 System: The user has completed the Google Form review and submitted feedback.";
    const [chatRes] = await db.query(
      "INSERT INTO chat_messages (ticketId, sender, message, created_at, is_read) VALUES (?, 'System', ?, NOW(), 0)",
      [ticketId, sysMsg]
    );

    // 5. REAL-TIME EMIT (Dito na hihilingin sa Next.js na mag-refresh ang state ng button nang kusa!)
    const io = req.app.get("io");
    if (io) {
      // I-update ang chat timeline
      io.to(ticketId).emit("receive_message", {
        id: chatRes.insertId,
        ticketId: ticketId,
        sender: "System",
        message: sysMsg,
        created_at: new Date(),
      });
      // Sabihan ang dashboard na nagbago ang data ng ticket na ito
      io.emit("ticket_status_changed", { id: ticketId, status: finalStatus });
    }

    console.log(`[Webhook Success] Ticket Number ${ticket_number} updated to UserMarkedDone=1 via Webhook.`);
    return res.status(200).json({ success: true, message: "Webhook processed successfully!" });

  } catch (error) {
    console.error("❌ Webhook Controller Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Kumuha ng survey status ng isang partikular na ticket
exports.getSurveyStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT userMarkedDone FROM tickets WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Ibalik kung true/1 o false/0 ang status
    return res.status(200).json({ userMarkedDone: rows[0].userMarkedDone });
  } catch (error) {
    console.error("Error fetching survey status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};