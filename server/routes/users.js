// server/routes/users.js

const express = require('express');
const { authenticateToken, requireITHead } = require('../middleware/auth');
const { requireStrongPassword } = require('../middleware/security');

const router = express.Router();
const userController = require('../controllers/userController');

// Public routes
router.post('/login', userController.loginUser);

// Protected routes - require authentication
router.use(authenticateToken);

// Get all users (IT Head only)
router.get('/', requireITHead, userController.getAllUsers);

// Get user by ID (IT Head only)
router.get('/:id', requireITHead, userController.getUserById);

// Register new user (IT Head only) — password strength enforced
router.post('/register', requireITHead, requireStrongPassword, userController.registerUser);

// Update existing user (IT Head only) — password strength enforced if changing password
router.put('/:id', requireITHead, requireStrongPassword, userController.updateUser);

// Toggle user status - suspend/activate (IT Head only)
router.put('/:id/status', requireITHead, userController.toggleUserStatus);

// Delete user (IT Head only)
router.delete('/:id', requireITHead, userController.deleteUser);

module.exports = router;
