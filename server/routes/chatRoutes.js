const express = require("express");
const router = express.Router();
const chatModel = require("../models/chatModel");

// In-memory state for typing indicators
// Format: { ticketId: { username: timestamp } }
const activeTypingStatus = {};

// 1. GET Chat History
router.get("/:ticketId/messages", async (req, res) => {
  try {
    const history = await chatModel.getMessagesByTicket(req.params.ticketId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// 2. POST New Message
router.post("/:ticketId/messages", async (req, res) => {
  const { sender, message, attachment } = req.body;
  const { ticketId } = req.params;

  try {
    const newId = await chatModel.saveMessage(
      ticketId,
      sender,
      message,
      attachment,
    );

    // Clear typing status when they send the message
    if (activeTypingStatus[ticketId] && activeTypingStatus[ticketId][sender]) {
      delete activeTypingStatus[ticketId][sender];
    }

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// 3. PUT Mark as Read
router.put("/:ticketId/read", async (req, res) => {
  try {
    const { reader } = req.body;
    await chatModel.markAsRead(req.params.ticketId, reader);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// 4. DELETE Message
router.delete("/messages/:messageId", async (req, res) => {
  try {
    await chatModel.deleteMessage(req.params.messageId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// 5. POST Typing Status (Debounced)
router.post("/:ticketId/typing", (req, res) => {
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
});

// 6. GET Typing Status
router.get("/:ticketId/typing", (req, res) => {
  const { ticketId } = req.params;
  const { currentUser } = req.query;

  const ticketTyping = activeTypingStatus[ticketId] || {};
  const now = Date.now();
  let opponentIsTyping = false;

  for (const [user, lastTypedAt] of Object.entries(ticketTyping)) {
    if (user !== currentUser) {
      if (now - lastTypedAt < 3000) {
        opponentIsTyping = true;
        break;
      } else {
        delete ticketTyping[user]; // Cleanup old data
      }
    }
  }

  res.json({ isTyping: opponentIsTyping });
});

module.exports = router;
