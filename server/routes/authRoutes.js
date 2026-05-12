const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateSession } = require("../middleware/authMiddleware");

// 1. Authentication Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// 2. Session Validation
router.get("/validate", validateSession); 

module.exports = router;