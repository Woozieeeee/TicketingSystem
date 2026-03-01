const chatModel = require("../models/chatModel");

// In-memory state for typing indicators (Doesn't touch DB)
const activeTypingStatus = {};

// 1. Get Messages (REST version)
exports.getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const history = await chatModel.getMessagesByTicket(ticketId);
    res.json(history);
  } catch (error) {
    console.error("Error loading history:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
};

// 2. Send Message (REST version)
exports.postMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { sender, message, attachment } = req.body;

    const newId = await chatModel.saveMessage(
      ticketId,
      sender,
      message,
      attachment,
    );

    // Clear typing status when message is sent
    if (activeTypingStatus[ticketId] && activeTypingStatus[ticketId][sender]) {
      delete activeTypingStatus[ticketId][sender];
    }

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// 3. Delete Message (REST version)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await chatModel.deleteMessage(messageId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

// 4. Mark as Read (REST version)
exports.markRead = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reader } = req.body;
    await chatModel.markAsRead(ticketId, reader);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// 5. Update Typing Status (In-memory)
exports.setTyping = (req, res) => {
  const { ticketId } = req.params;
  const { username, isTyping } = req.body;

  if (!activeTypingStatus[ticketId]) {
    activeTypingStatus[ticketId] = {};
  }

  if (isTyping) {
    activeTypingStatus[ticketId][username] = Date.now();
  } else {
    delete activeTypingStatus[ticketId][username];
  }
  res.json({ success: true });
};

// server/controllers/chatController.js

exports.getTyping = (req, res) => {
  const { ticketId } = req.params;
  const { currentUser } = req.query;

  const ticketTyping = activeTypingStatus[ticketId] || {};
  const now = Date.now();
  let opponentIsTyping = false;

  for (const [user, lastTypedAt] of Object.entries(ticketTyping)) {
    if (user !== currentUser) {
      // 🟢 Logic: If they haven't sent a ping in 4 seconds, they are "Idle"
      if (now - lastTypedAt < 4000) {
        opponentIsTyping = true;
        break;
      } else {
        delete ticketTyping[user]; // Cleanup memory for idle users
      }
    }
  }
  res.json({ isTyping: opponentIsTyping });
};
