// server/controllers/authController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { generateAndSaveToken } = require("../middleware/authMiddleware");

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
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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
exports.logout = (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};