const userModel = require("../models/user");
const { v4: uuidv4 } = require("uuid");

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.json(users);
  } catch (err) {
    console.error("❌ Get Users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Register a new user
 */
const registerUser = async (req, res) => {
  try {
    const { username, password, role, dept } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await userModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const userId = uuidv4();
    const userData = {
      id: userId,
      username,
      password, // Will be hashed in the model
      role,
      dept: dept || "General",
    };

    await userModel.create(userData);
    res.status(201).json({ userId, message: "User created successfully" });
  } catch (err) {
    console.error("❌ Register User Error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * Update user by ID
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, dept } = req.body;

    // Check if user exists
    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = { username, role, dept };
    await userModel.updateById(id, userData);
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("❌ Update User Error:", err);
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
    console.error("❌ Get User Error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * Delete user by ID
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await userModel.deleteById(id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete User Error:", err);
    res.status(500).json({ error: "Failed to delete user" });
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

    // Verify password using bcrypt
    const isValidPassword = await userModel.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate and store auth token
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
    console.error("❌ Login User Error:", err);
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
};
