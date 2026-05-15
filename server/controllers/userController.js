const userModel = require("../models/user");
const { v4: uuidv4 } = require("uuid");
const activity = require("../lib/activityLogger");
const security = require("../lib/securityAlerts");

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.json(users);
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Register a new user (admin action)
 */
const registerUser = async (req, res) => {
  try {
    const { username, password, role, dept } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await userModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const userId = uuidv4();
    const userData = {
      id: userId,
      username,
      password,
      role,
      dept: dept || "General",
    };

    await userModel.create(userData);
    await activity.userCreated(req, { userId, newUser: username, role, dept: dept || "General" });

    res.status(201).json({ userId, message: "User created successfully" });
  } catch (err) {
    console.error("Register User Error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * Update user by ID
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, dept, password } = req.body;

    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let hashedPassword = null;
    if (password) {
      const bcrypt = require("bcrypt");
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await userModel.updateById(id, { username, role, dept, password: hashedPassword });

    await activity.userUpdated(req, {
      userId: id,
      targetUser: username,
      role,
      dept,
      previousRole: existingUser.role,
    });

    if (existingUser.role !== role) {
      await security.roleChanged({
        actor: req.user?.username || "system",
        targetUser: username,
        previousRole: existingUser.role,
        newRole: role,
      });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get User Error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * Delete user by ID
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await userModel.deleteById(id);

    await activity.userDeleted(req, {
      userId: id,
      deletedUser: existingUser.username,
      deletedRole: existingUser.role,
    });

    await security.userDeleted({
      actor: req.user?.username || "system",
      deletedUser: existingUser.username,
      deletedRole: existingUser.role,
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

/**
 * Toggle user status (suspend/activate)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Active' or 'Suspended'" });
    }

    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await userModel.updateStatus(id, status);

    res.json({ message: `User ${status === 'Suspended' ? 'suspended' : 'activated'} successfully` });
  } catch (err) {
    if (err.message === 'STATUS_COLUMN_MISSING') {
      return res.status(500).json({
        error: "Status column not found. Run: ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'Active';"
      });
    }
    console.error("Toggle Status Error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

/**
 * Login user
 */
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await userModel.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = uuidv4();
    await userModel.updateToken(user.id, token);

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      dept: user.dept,
      token,
    });
  } catch (err) {
    console.error("Login User Error:", err);
    res.status(500).json({ error: "Failed to login user" });
  }
};

module.exports = {
  getAllUsers,
  registerUser,
  updateUser,
  deleteUser,
  getUserById,
  loginUser,
  toggleUserStatus,
};
