// server/routes/chatRoutes.js
const express = require("express");
const router = express.Router();

// 🟢 FIX: Ituro natin direct sa bagong chatController file na ginawa natin kanina
const chatController = require("../controllers/chatController"); 

// 1. GET Chat History
router.get("/:ticketId/messages", chatController.getMessages);

// 1.1 GET Latest Messages (for polling)
router.get("/:ticketId/messages/latest", chatController.getLatestMessages);

// 1.2 GET Unread Count
router.get("/unread-count", chatController.getUnreadCount);

// 2. POST New Message
router.post("/:ticketId/messages", chatController.postMessage);

// 3. PATCH Mark as Read
router.patch("/:ticketId/read", chatController.markRead);

// 4. DELETE Message
router.delete("/messages/:messageId", chatController.deleteMessage);

// 5. POST Update Typing Status
router.post("/:ticketId/typing", chatController.setTyping);

// 6. GET Fetch Typing Status
router.get("/:ticketId/typing", chatController.getTyping);

module.exports = router;