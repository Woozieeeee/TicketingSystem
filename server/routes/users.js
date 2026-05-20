// server/routes/users.js

const express = require('express');
const { authenticateToken, requireITHead } = require('../middleware/auth');
const { requireStrongPassword } = require('../middleware/security');
const { validateBody, validateId } = require('../middleware/validation');

const router = express.Router();
const userController = require('../controllers/userController');

// Public routes
router.post('/login', validateBody('login'), userController.loginUser);

// Protected routes - require authentication
router.use(authenticateToken);

// Get all users (IT Head only)
router.get('/', requireITHead, userController.getAllUsers);

// Get user by ID (IT Head only)
router.get('/:id', validateId, requireITHead, userController.getUserById);

// Register new user (IT Head only) — password strength enforced
router.post('/register', requireITHead, requireStrongPassword, validateBody('register'), userController.registerUser);

// Update existing user (IT Head only) — password strength enforced if changing password
router.put('/:id', validateId, requireITHead, requireStrongPassword, validateBody('updateUser'), userController.updateUser);

// Toggle user status - suspend/activate (IT Head only)
router.put('/:id/status', validateId, requireITHead, userController.toggleUserStatus);

// Delete user (IT Head only)
router.delete('/:id', validateId, requireITHead, userController.deleteUser);

// Change password (authenticated users only)
router.put('/change-password', authenticateToken, userController.changePassword);

module.exports = router;
