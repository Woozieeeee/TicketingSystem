const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { validateSession } = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');

// 1. Authentication Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// 2. Session Validation
router.get("/validate", validateSession || ((req, res) => res.status(200).send("OK"))); 

module.exports = router;