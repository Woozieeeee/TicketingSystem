// server/routes/passwordResetRoutes.js
const express = require("express");
const router = express.Router();
const passwordResetController = require("../controllers/passwordResetController");
const { validateBody } = require("../middleware/validation");

// Request password reset
router.post("/request", passwordResetController.requestReset);

// Reset password with token
router.post("/reset", passwordResetController.resetPassword);

// Verify reset token
router.get("/verify/:token", passwordResetController.verifyToken);

module.exports = router;
