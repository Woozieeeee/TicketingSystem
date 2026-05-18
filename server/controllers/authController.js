// server/controllers/authController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { generateAndSaveToken } = require("../middleware/authMiddleware");
const activity = require("../lib/activityLogger");
const security = require("../lib/securityAlerts");
const { logLoginAttempt } = require("../middleware/monitoring");

// --- REGISTER ---
exports.register = async (req, res) => {
  try {
    const { username, password, dept } = req.body;

    if (!username || !password || !dept) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const cleanDept = dept.trim().toUpperCase();

    const [existingHeads] = await db.query(
      "SELECT id FROM users WHERE dept = ? AND role = 'Head'",
      [cleanDept],
    );

    const assignedRole = existingHeads.length === 0 ? "Head" : "User";
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = `u_${Date.now()}`;

    await db.query(
      `INSERT INTO users (id, username, password, dept, role, login_count)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, username, hashedPassword, cleanDept, assignedRole],
    );

    await activity.userRegistered(req, { username, role: assignedRole, dept: cleanDept });

    res.status(201).json({
      success: true,
      role: assignedRole,
      dept: cleanDept,
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ error: "Registration failed", message: error.message });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );

    if (rows.length === 0) {
      await logLoginAttempt(username, false, req.ip, req.get("User-Agent"), "User not found");
      await security.failedLogin({ username, reason: "User not found", ip: req.ip });
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];

    if (user.status === 'Suspended') {
      await logLoginAttempt(username, false, req.ip, req.get("User-Agent"), "Account suspended");
      return res.status(403).json({ message: "Your account has been suspended. Contact your administrator." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await logLoginAttempt(username, false, req.ip, req.get("User-Agent"), "Invalid password");
      await security.failedLogin({ username, reason: "Invalid password", ip: req.ip });
      return res.status(401).json({ message: "Invalid username or password" });
    }

    await db.query(
      "UPDATE users SET login_count = login_count + 1 WHERE id = ?",
      [user.id],
    );

    const { token, expires } = await generateAndSaveToken(user.id);

    const [updatedRows] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [user.id],
    );
    const updatedUser = updatedRows[0];

    await logLoginAttempt(updatedUser.username, true, req.ip, req.get("User-Agent"));
    await activity.loginSuccess(req, updatedUser);

    // Set httpOnly cookies for sensitive data
    res.cookie('user_id', updatedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('user_role', updatedUser.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('user_dept', updatedUser.dept, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('login_count', updatedUser.login_count, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Set auth token cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Only return username in response body
    return res.status(200).json({
      username: updatedUser.username,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- LOGOUT ---
exports.logout = async (req, res) => {
  await activity.logout(req, req.body?.username);

  // Clear all httpOnly cookies
  res.clearCookie('auth_token');
  res.clearCookie('user_id');
  res.clearCookie('user_role');
  res.clearCookie('user_dept');
  res.clearCookie('login_count');

  return res.status(200).json({ success: true, message: "Logged out successfully" });
};
