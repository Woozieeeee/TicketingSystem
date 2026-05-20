const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateSession } = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validation");
const {
  loginLimiter,
  registerLimiter,
  requireStrongPassword,
} = require("../middleware/security");

// 1. Authentication Routes
router.post("/register", registerLimiter, requireStrongPassword, validateBody('register'), authController.register);
router.post("/login", loginLimiter, validateBody('login'), authController.login);
router.post("/logout", authController.logout);

// 2. Session Validation
router.get("/validate", validateSession);

module.exports = router;
