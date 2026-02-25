// server/controllers/notificationController.js
const db = require("../config/db");

// Get notifications for a specific user
exports.getUserNotifications = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Promise-based query (Matches your ticketController)
    const [results] = await db.query(
      "SELECT * FROM notifications WHERE username = ? ORDER BY created_at DESC LIMIT 50",
      [username],
    );

    return res.status(200).json(results || []);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    const query =
      "UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE id = ?";
    const [results] = await db.query(query, [notificationId]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error updating notification:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { username, message, ticketGlobalId, type } = req.body;

    if (!username || !message) {
      return res
        .status(400)
        .json({ error: "Username and message are required" });
    }

    const query = `
      INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, NOW(), NOW())
    `;

    const [results] = await db.query(query, [
      username,
      message,
      ticketGlobalId || null,
      type || "default",
    ]);

    return res.status(201).json({
      success: true,
      message: "Notification created",
      id: results.insertId,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    const [results] = await db.query("DELETE FROM notifications WHERE id = ?", [
      notificationId,
    ]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
};

exports.remindTicket = async (req, res) => {
  try {
    const { id } = req.params; // This is the ticket's globalId

    // 1. Update the ticket's reminder status
    const updateQuery = `
      UPDATE tickets 
      SET reminder_flag = 1, last_reminded_at = NOW() 
      WHERE id = ?
    `;
    await db.query(updateQuery, [id]);

    // 2. Fetch the ticket details so we know which department it belongs to
    const [ticketRows] = await db.query(
      "SELECT id, title, dept, createdBy FROM tickets WHERE id = ?",
      [id],
    );

    if (ticketRows.length > 0) {
      const ticket = ticketRows[0];

      // 3. Find the User(s) who are the 'Head' of this department
      const [headRows] = await db.query(
        "SELECT username FROM users WHERE dept = ? AND role = 'Head'",
        [ticket.dept],
      );

      // 4. Create a notification for the Department Head(s)
      for (const head of headRows) {
        const message = `Reminder: Ticket #${ticket.id} ("${ticket.title}") from ${ticket.createdBy} needs your attention.`;

        const notifQuery = `
          INSERT INTO notifications (username, message, ticketGlobalId, type, is_read, created_at, updated_at)
          VALUES (?, ?, ?, 'reminder', 0, NOW(), NOW())
        `;
        await db.query(notifQuery, [head.username, message, id]);
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
