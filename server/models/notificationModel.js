const Notification = require("../models/notificationModel");

exports.getUserNotifications = (req, res) => {
  const { username } = req.params;

  Notification.getByUsername(username, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

exports.markRead = (req, res) => {
  const { id } = req.params;

  Notification.markAsRead(id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to update" });
    }
    res.json({ message: "Notification updated" });
  });
};
