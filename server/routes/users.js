// server/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Register new user
router.post('/register', userController.registerUser);

// Update existing user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Login user
router.post('/login', userController.loginUser);

module.exports = router;