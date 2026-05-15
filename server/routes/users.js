// server/routes/users.js

const express = require('express');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');
const { requireStrongPassword } = require('../middleware/security');

const router = express.Router();
const userController = require('../controllers/userController');

// Public routes
router.post('/login', userController.loginUser);

// Protected routes - require authentication
router.use(authenticateToken);

// Get all users (Admin/Staff/Head only)
router.get('/', requireAdminOrStaff, userController.getAllUsers);

// Get user by ID (Admin/Staff/Head only)
router.get('/:id', requireAdminOrStaff, userController.getUserById);

// Register new user (Admin/Staff/Head only) — password strength enforced
router.post('/register', requireAdminOrStaff, requireStrongPassword, userController.registerUser);

// Update existing user (Admin/Staff/Head only) — password strength enforced if changing password
router.put('/:id', requireAdminOrStaff, requireStrongPassword, userController.updateUser);

// Toggle user status - suspend/activate (Admin/Staff/Head only)
router.put('/:id/status', requireAdminOrStaff, userController.toggleUserStatus);

// Delete user (Admin/Staff/Head only)
router.delete('/:id', requireAdminOrStaff, userController.deleteUser);

module.exports = router;
