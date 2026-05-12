// server/routes/users.js

const express = require('express');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');

const router = express.Router();
const userController = require('../controllers/userController');

// Public routes
router.post('/login', userController.loginUser);

// Protected routes - require authentication
router.use(authenticateToken);

// Get all users (Admin/Staff only)
router.get('/', requireAdminOrStaff, userController.getAllUsers);

// Get user by ID (Admin/Staff only)
router.get('/:id', requireAdminOrStaff, userController.getUserById);

// Register new user (Admin/Staff only)
router.post('/register', requireAdminOrStaff, userController.registerUser);

// Update existing user (Admin/Staff only)
router.put('/:id', requireAdminOrStaff, userController.updateUser);

// Delete user (Admin/Staff only)
router.delete('/:id', requireAdminOrStaff, userController.deleteUser);

module.exports = router;