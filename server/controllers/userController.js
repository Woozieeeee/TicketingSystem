const userModel = require("../models/user");
const { v4: uuidv4 } = require("uuid");
const activity = require("../lib/activityLogger");
const security = require("../lib/securityAlerts");

/**
 * Get all users
 * Pinagsama ang structure ng co-worker at ang frontend mapping/data normalization mo.
 */
const getAllUsers = async (req, res) => {
  try {
    const dbUsers = await userModel.getAll();
    
    // Mismatch Fix: I-map ang database fields sa Frontend TypeScript interface expectations
    const formattedUsers = dbUsers.map(user => {
      // Pinag-isang status checker logic mula sa inyong dalawa
      let derivedStatus = user.status;
      if (derivedStatus !== 'Suspended') {
        derivedStatus = (user.status === 'Active' || user.login_count > 0 || user.loginCount > 0) ? 'Active' : 'Pending';
      }

      return {
        id: user.id,
        name: user.username,          // DB 'username' -> Frontend UI 'name'
        email: user.email || `${user.username.toLowerCase().replace(/\s+/g, '')}@domain.com`, // Fallback para sa structural safety
        role: user.role,              // 'Head' | 'Admin' | 'User'
        status: derivedStatus,        // 'Active' | 'Pending' | 'Suspended'
        joinedDate: user.created_at || user.joinedDate || new Date().toISOString(), // DB timestamp conversion
        dept: user.dept || "General",
        loginCount: user.login_count || user.loginCount || 0
      };
    });

    res.json(formattedUsers);
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Register a new user (admin action)
 */
/**
 * Register a new user (admin action)
 */
const registerUser = async (req, res) => {
  try {
    const { username, password, role, dept } = req.body;

    if (!username || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await userModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 🟢 FIX: Inalis ang manual Controller hashing layer. 
    // Hahayaan nating ang userModel.create() ang mag-hash natively gaya ng orihinal na setup.
    const finalPassword = password || 'ChangeMe123!';

    const userId = uuidv4();
    const userData = {
      id: userId,
      username,
      password: finalPassword, // Ipasa bilang plain text kung si model naman ang nagpa-process ng encryption
      role,
      dept: dept || "General",
      status: "Pending", 
      login_count: 0
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

    const updatePayload = { username, role, dept };

    // I-hash lang ang password kung may bagong ipinasang password mula sa form modal
    if (password && password.trim() !== "") {
      const bcrypt = require("bcrypt");
      updatePayload.password = await bcrypt.hash(password, 10);
    }

    await userModel.updateById(id, updatePayload);

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

    // In-ensure na naka-map din ang fields para sa structure parity ng single response hook
    const formattedUser = {
      id: user.id,
      name: user.username,
      email: user.email || `${user.username.toLowerCase().replace(/\s+/g, '')}@domain.com`,
      role: user.role,
      status: user.status,
      joinedDate: user.created_at || user.joinedDate,
      dept: user.dept || "General",
      loginCount: user.login_count || user.loginCount || 0
    };

    res.json(formattedUser);
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

    console.log(`[toggleUserStatus] Updating user ${id} to status: ${status}`);

    if (!status || !['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Active' or 'Suspended'" });
    }

    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await userModel.updateStatus(id, status);
    console.log(`[toggleUserStatus] Successfully updated user ${id} to status: ${status}`);

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

    // 🔴 SECURITY BLOCKER: Harangin agad kapag ang account ay naka-suspend sa database status level
    if (user.status === 'Suspended') {
      return res.status(403).json({ error: "Your account has been suspended. Contact IT Department." });
    }

    const isValidPassword = await userModel.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = uuidv4();
    await userModel.updateToken(user.id, token);
    
    // Dagdagan ang login count sa tuwing matagumpay na nagla-log in (para gumana ang dashboard mapping niyo)
    if (typeof userModel.incrementLoginCount === 'function') {
      await userModel.incrementLoginCount(user.id);
    } else {
      await userModel.incrementLoginCount(user.id);
    }

    const response = {
      id: user.id,
      username: user.username,
      role: user.role,
      dept: user.dept,
      login_count: (user.login_count || 0) + 1,
      token,
    };

    // Check kung kailangan magpalit ng default o pansamantalang password
    if (user.password_change_required === 1) {
      response.passwordChangeRequired = true;
    }

    res.json(response);
  } catch (err) {
    console.error("Login User Error:", err);
    res.status(500).json({ error: "Failed to login user" });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValidPassword = await userModel.verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userModel.updateById(userId, { 
      password: hashedPassword,
      password_change_required: 0 
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ error: "Failed to change password" });
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
  changePassword,
};