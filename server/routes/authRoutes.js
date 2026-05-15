const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateSession } = require("../middleware/authMiddleware");
const {
  loginLimiter,
  registerLimiter,
  requireStrongPassword,
} = require("../middleware/security");

// 1. Authentication Routes
router.post("/register", registerLimiter, requireStrongPassword, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);

// 2. Session Validation
router.get("/validate", validateSession);

module.exports = router;
