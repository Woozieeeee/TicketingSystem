// server/controllers/ticketController.js
const db = require("../config/db");

// GET all tickets with filtering
exports.getTickets = async (req, res) => {
  try {
    const { role, dept, username } = req.query;
    let query = "SELECT * FROM tickets";
    const params = [];

    if (role === "Head" && dept) {
      query += " WHERE dept = ?";
      params.push(dept);
    } else if (role === "User" && username) {
      query += " WHERE createdBy = ?";
      params.push(username);
    }

    query += " ORDER BY date DESC";

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

    // 1. Insert the ticket into the database
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

    // 2. Find the Head(s) for this specific department
    const [headRows] = await db.query(
      "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
      [dept],
    );

    // 3. Create a notification for each Head found
    for (const head of headRows) {
      const message = `New ticket created by ${createdBy} in ${dept}: "${title}"`;

      const notifQuery = `
        INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at)
        VALUES (?, ?, ?, 'new_ticket', 0, NOW(), NOW())
      `;
      await db.query(notifQuery, [head.username, message, id]);
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

// UPDATE ticket (Supercharged with 2-Party Confirmation)
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

    // 1. Fetch the existing ticket
    const [existing] = await db.query("SELECT * FROM tickets WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ error: "Ticket not found" });

    const ticket = existing[0];

    // 2. Determine new values
    const newTitle = title !== undefined ? title : ticket.title;
    const newDesc =
      description !== undefined ? description : ticket.description;
    const newCat = category !== undefined ? category : ticket.category;
    let newStatus = status !== undefined ? status : ticket.status;

    // Map the new flags (or keep existing if not provided)
    let newUserMarked =
      userMarkedDone !== undefined
        ? userMarkedDone
        : ticket.userMarkedDone || 0;
    let newHeadMarked =
      headMarkedDone !== undefined
        ? headMarkedDone
        : ticket.headMarkedDone || 0;

    // 🔴 3. AUTO-RESOLVE LOGIC: If BOTH parties marked it done, it becomes FINISHED
    let justFinished = false;
    if (newUserMarked && newHeadMarked && ticket.status !== "FINISHED") {
      newStatus = "FINISHED";
      justFinished = true;
    }

    // 🔴 RE-OPEN LOGIC: If someone disagrees and re-opens it, reset the flags
    if (newStatus === "PENDING" && ticket.status !== "PENDING") {
      newUserMarked = 0;
      newHeadMarked = 0;
    }

    // 4. Update Database
    const query = `
      UPDATE tickets 
      SET title = ?, description = ?, category = ?, status = ?, userMarkedDone = ?, headMarkedDone = ?, updatedAt = NOW() 
      WHERE id = ?
    `;
    await db.query(query, [
      newTitle,
      newDesc,
      newCat,
      newStatus,
      newUserMarked,
      newHeadMarked,
      id,
    ]);

    // 5. SMART NOTIFICATIONS
    if (justFinished) {
      const msgHead = `Success! Ticket "${newTitle}" was confirmed by both parties and is now FINISHED.`;
      const msgUser = `Success! Your ticket "${newTitle}" was confirmed by the Head and is now FINISHED.`;

      const [headRows] = await db.query(
        "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
        [ticket.dept],
      );
      for (const head of headRows) {
        await db.query(
          "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'status_update', 0, NOW(), NOW())",
          [head.username, msgHead, id],
        );
      }
      await db.query(
        "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'status_update', 0, NOW(), NOW())",
        [ticket.createdBy, msgUser, id],
      );
    } else if (newHeadMarked && !ticket.headMarkedDone) {
      const msg = `Head has marked "${newTitle}" as resolved. Please confirm to close the ticket.`;
      await db.query(
        "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'status_update', 0, NOW(), NOW())",
        [ticket.createdBy, msg, id],
      );
    } else if (newUserMarked && !ticket.userMarkedDone) {
      const msg = `${ticket.createdBy} marked "${newTitle}" as resolved. Please confirm to close the ticket.`;
      const [headRows] = await db.query(
        "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
        [ticket.dept],
      );
      for (const head of headRows) {
        await db.query(
          "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'status_update', 0, NOW(), NOW())",
          [head.username, msg, id],
        );
      }
    } else if (newStatus === "IN_PROGRESS" && ticket.status !== "IN_PROGRESS") {
      const message = `Your ticket "${newTitle}" is now In Progress.`;
      await db.query(
        "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'status_update', 0, NOW(), NOW())",
        [ticket.createdBy, message, id],
      );
    } else if (newStatus === "PENDING" && ticket.status !== "PENDING") {
      const message = `Ticket "${newTitle}" was REJECTED and sent back to Pending. Follow-up required.`;
      const [headRows] = await db.query(
        "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
        [ticket.dept],
      );
      for (const head of headRows) {
        await db.query(
          "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'status_update', 0, NOW(), NOW())",
          [head.username, message, id],
        );
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

// REMIND Ticket (Supercharged)
exports.remindTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Update the ticket flags
    await db.query(
      "UPDATE tickets SET reminder_flag = 1, last_reminded_at = NOW() WHERE id = ?",
      [id],
    );

    // 2. Fetch ticket info to find the Head
    const [ticketRows] = await db.query(
      "SELECT title, dept, createdBy FROM tickets WHERE id = ?",
      [id],
    );

    if (ticketRows.length > 0) {
      const ticket = ticketRows[0];

      // 3. Find the Head of the department
      const [headRows] = await db.query(
        "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
        [ticket.dept],
      );

      // 4. Create Notification for the Head
      for (const head of headRows) {
        const message = `URGENT NUDGE: ${ticket.createdBy} is asking for an update on "${ticket.title}"`;
        await db.query(
          "INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at) VALUES (?, ?, ?, 'reminder', 0, NOW(), NOW())",
          [head.username, message, id],
        );
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Reminder sent to Head" });
  } catch (error) {
    console.error("❌ Remind Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
