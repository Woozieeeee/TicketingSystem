// server/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat"); // Awtomatikong babasahin ang index.js ng controllers

// 1. GET Chat History
router.get("/:ticketId/messages", chatController.getMessages);

// 2. POST New Message
router.post("/:ticketId/messages", chatController.postMessage);

// 3. PATCH Mark as Read (Ginawa nating PATCH para tama sa REST standards ng controller mo)
router.patch("/:ticketId/read", chatController.markRead);

// 4. DELETE Message
router.delete("/messages/:messageId", chatController.deleteMessage);

// 5. POST Update Typing Status
router.post("/:ticketId/typing", chatController.setTyping);

// 6. GET Fetch Typing Status
router.get("/:ticketId/typing", chatController.getTyping);

module.exports = router;