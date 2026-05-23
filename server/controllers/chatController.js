// server/controllers/chatController.js
const chatModel = require("../models/chatModel");

// In-memory state for typing indicators (Doesn't touch DB)
const activeTypingStatus = {};

// 1. Get Messages (REST version)
exports.getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const history = await chatModel.getMessagesByTicket(ticketId);
    
    // Ibalik ang nakuhang array data nang malinis
    return res.status(200).json(history);
  } catch (error) {
    console.error("Error loading history:", error);
    return res.status(500).json({ error: "Failed to load messages" });
  }
};

// 1.1 Get Latest Messages (for polling)
exports.getLatestMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { lastMessageId, lastTimestamp } = req.query;
    
    const latestMessages = await chatModel.getLatestMessages(
      ticketId,
      lastMessageId ? parseInt(lastMessageId) : null,
      lastTimestamp ? lastTimestamp : null
    );
    
    return res.status(200).json(latestMessages);
  } catch (error) {
    console.error("Error loading latest messages:", error);
    return res.status(500).json({ error: "Failed to load latest messages" });
  }
};

// 1.2 Get Unread Count
exports.getUnreadCount = async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }
    
    const unreadCount = await chatModel.getUnreadCount(username);
    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return res.status(500).json({ error: "Failed to get unread count" });
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
      attachment
    );

    // Clear typing status kapag nag-click na ng send button at pumasok na sa DB
    if (activeTypingStatus[ticketId] && activeTypingStatus[ticketId][sender]) {
      delete activeTypingStatus[ticketId][sender];
    }

    return res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

// 3. Delete Message (REST version)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const success = await chatModel.deleteMessage(messageId);
    
    if (!success) {
      return res.status(400).json({ error: "Failed to update target row" });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ error: "Failed to delete message" });
  }
};

// 4. Mark as Read (REST version)
exports.markRead = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reader } = req.body;
    
    await chatModel.markAsRead(ticketId, reader);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    return res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// 5. Update Typing Status (In-memory - Triggered on Frontend Input onChange)
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
  
  return res.status(200).json({ success: true });
};

// 6. Fetch Typing Status (In-memory Polling Engine)
exports.getTyping = (req, res) => {
  const { ticketId } = req.params;
  const { currentUser } = req.query;

  const ticketTyping = activeTypingStatus[ticketId] || {};
  const now = Date.now();
  let opponentIsTyping = false;

  for (const [user, lastTypedAt] of Object.entries(ticketTyping)) {
    if (user !== currentUser) {
      // 🟢 Logic Check: Kapag walang param update sa nakalipas na 4 segundo, considered idle na
      if (now - lastTypedAt < 4000) {
        opponentIsTyping = true;
        break;
      } else {
        delete ticketTyping[user]; // Panatilihing malinis ang RAM cache para iwas memory leak
      }
    }
  }
  
  return res.status(200).json({ isTyping: opponentIsTyping });
};