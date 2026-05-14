// server/controllers/authController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { generateAndSaveToken } = require("../middleware/authMiddleware");
const { logLoginAttempt, logSecurityEvent } = require("../middleware/monitoring");

// --- REGISTER ---
exports.register = async (req, res) => {
  try {
    const { username, password, dept } = req.body;

    if (!username || !password || !dept) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1. CLEAN the department name
    const cleanDept = dept.trim().toUpperCase();

    // 2. CHECK if this is the first user for this department
    const [existingDeptMembers] = await db.query(
      "SELECT id FROM users WHERE dept = ?",
      [cleanDept],
    );

    // 3. ASSIGN ROLE
    const assignedRole = existingDeptMembers.length === 0 ? "Head" : "User";

    // 4. HASH the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. GENERATE ID
    const id = `u_${Date.now()}`;

    // 6. SAVE to database
    const query = `
      INSERT INTO users (id, username, password, dept, role, login_count) 
      VALUES (?, ?, ?, ?, ?, 0)
    `;

    await db.query(query, [id, username, hashedPassword, cleanDept, assignedRole]);

    console.log(`✅ User ${username} registered as ${assignedRole} for ${cleanDept}`);

    // Log activity
    try {
      await db.query(
        `INSERT INTO activity_logs (username, action, resource, details, ip_address, user_agent, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, 'USER_REGISTERED', 'AUTH', JSON.stringify({ role: assignedRole, dept: cleanDept }), req.ip, req.get('User-Agent'), assignedRole]
      );
    } catch (logErr) { /* silent */ }

    res.status(201).json({
      success: true,
      role: assignedRole,
      dept: cleanDept,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    res.status(500).json({ error: "Registration failed", message: error.message });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      await logLoginAttempt(username, false, req.ip, req.get('User-Agent'), 'User not found');
      await logSecurityEvent('FAILED_LOGIN', { username, reason: 'User not found', ip: req.ip });

      // Check for brute-force: 5+ failed attempts in 15 min
      try {
        const [recentFails] = await db.query(
          `SELECT COUNT(*) as cnt FROM login_attempts
           WHERE username = ? AND success = FALSE AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
          [username]
        );
        if (recentFails[0].cnt >= 5) {
          await logSecurityEvent('BRUTE_FORCE_SUSPECTED', {
            username, attempts: recentFails[0].cnt, ip: req.ip,
            message: `${recentFails[0].cnt} failed login attempts in 15 minutes`
          });
        }
      } catch (e) { /* silent */ }

      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logLoginAttempt(username, false, req.ip, req.get('User-Agent'), 'Invalid password');
      await logSecurityEvent('FAILED_LOGIN', { username, reason: 'Invalid password', ip: req.ip });

      // Check for brute-force
      try {
        const [recentFails] = await db.query(
          `SELECT COUNT(*) as cnt FROM login_attempts
           WHERE username = ? AND success = FALSE AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
          [username]
        );
        if (recentFails[0].cnt >= 5) {
          await logSecurityEvent('BRUTE_FORCE_SUSPECTED', {
            username, attempts: recentFails[0].cnt, ip: req.ip,
            message: `${recentFails[0].cnt} failed login attempts in 15 minutes`
          });
        }
      } catch (e) { /* silent */ }

      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 3. Increment the login count
    await db.query(
      "UPDATE users SET login_count = login_count + 1 WHERE id = ?",
      [user.id],
    );

    // 4. GENERATE AND SAVE TOKEN
    const { token, expires } = await generateAndSaveToken(user.id);

    // 5. GET FRESH DATA
    const [updatedRows] = await db.query("SELECT * FROM users WHERE id = ?", [user.id]);
    const updatedUser = updatedRows[0];

    // Log successful login
    await logLoginAttempt(updatedUser.username, true, req.ip, req.get('User-Agent'));
    try {
      await db.query(
        `INSERT INTO activity_logs (username, action, resource, details, ip_address, user_agent, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [updatedUser.username, 'LOGIN_SUCCESS', 'AUTH', JSON.stringify({ login_count: updatedUser.login_count }), req.ip, req.get('User-Agent'), updatedUser.role]
      );
    } catch (logErr) { /* silent */ }

    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      dept: updatedUser.dept,
      login_count: updatedUser.login_count,
      token: token,
      tokenExpires: expires,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- LOGOUT ---
exports.logout = async (req, res) => {
  const username = req.body?.username || 'unknown';
  try {
    await db.query(
      `INSERT INTO activity_logs (username, action, resource, details, ip_address, user_agent, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, 'LOGOUT', 'AUTH', JSON.stringify({ timestamp: new Date().toISOString() }), req.ip, req.get('User-Agent'), 'N/A']
    );
  } catch (logErr) { /* silent */ }
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};