// server/routes/users.js

const express = require('express');
// Ensure these imports point to the middleware file we updated with the 'Head' role logic
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');

const router = express.Router();
const userController = require('../controllers/userController');

// Public routes
router.post('/login', userController.loginUser);

// Protected routes - require authentication
router.use(authenticateToken);

/** 
 * Protected routes - require Admin, Staff, or Head permissions
 * If you still get a 403, ensure that requireAdminOrStaff in 
 * ../middleware/auth.js includes: if (['Admin', 'Staff', 'Head'].includes(req.user.role))
 */

// Get all users (Admin/Staff/Head only)
router.get('/', requireAdminOrStaff, userController.getAllUsers);

// Get user by ID (Admin/Staff/Head only)
router.get('/:id', requireAdminOrStaff, userController.getUserById);

// Register new user (Admin/Staff/Head only)
router.post('/register', requireAdminOrStaff, userController.registerUser);

// Update existing user (Admin/Staff/Head only)
router.put('/:id', requireAdminOrStaff, userController.updateUser);

// Delete user (Admin/Staff/Head only)
router.delete('/:id', requireAdminOrStaff, userController.deleteUser);

module.exports = router;