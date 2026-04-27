// server/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const chat = require("../controllers/chat");

// 1. GET Chat History
router.get("/:ticketId/messages", chat.getMessages);

// 2. POST New Message
router.post("/:ticketId/messages", chat.postMessage);

// 3. PUT Mark as Read
router.put("/:ticketId/read", chat.markRead);

// 4. DELETE Message
router.delete("/messages/:messageId", chat.deleteMessage);

// 5. POST Typing Status (Debounced)
router.post("/:ticketId/typing", chat.setTyping);

// 6. GET Typing Status
router.get("/:ticketId/typing", chat.getTyping);

module.exports = router;
