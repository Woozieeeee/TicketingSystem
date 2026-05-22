// server/routes/user.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// I-import ang authMiddleware mo (Mananatili ang sa iyo)
const { verifyToken, requireITHead } = require("../middleware/authMiddleware");

// 🟢 Kunin ang lahat ng users (Para lang sa IT Head) — Naka-sync sa frontend dashboard requirement fallback
router.get("/", verifyToken, requireITHead, userController.getAllUsers);

// 🟢 Mag-register ng bagong account (Para lang sa IT Head) — Mananatili ang kasalukuyan mong setup
router.post("/register", verifyToken, requireITHead, userController.registerUser);

// 🟢 Update user status (activate/suspend) — Missing endpoint causing the JSON parse error
router.put("/:id/status", verifyToken, requireITHead, userController.toggleUserStatus);

// 🟢 Update user details (edit user)
router.put("/:id", verifyToken, requireITHead, userController.updateUser);

// 🟢 Delete user
router.delete("/:id", verifyToken, requireITHead, userController.deleteUser);

// 🟢 Get user by ID
router.get("/:id", verifyToken, requireITHead, userController.getUserById);

module.exports = router;