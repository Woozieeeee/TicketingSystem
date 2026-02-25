const User = require("../models/authModel");

// server/controllers/authController.js
const db = require("../config/db");

exports.register = async (req, res) => {
  try {
    const { username, password, dept } = req.body;

    if (!username || !password || !dept) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1. CLEAN the department name to prevent duplicates (e.g., "it" becomes "IT")
    const cleanDept = dept.trim().toUpperCase();

    // 2. CHECK if this is the first user for this department
    const [existingDeptMembers] = await db.query(
      "SELECT id FROM users WHERE dept = ?",
      [cleanDept],
    );

    // 3. ASSIGN ROLE: First person to register in a dept is 'Head', everyone else is 'User'
    const assignedRole = existingDeptMembers.length === 0 ? "Head" : "User";

    // 4. GENERATE ID (matches your existing format)
    const id = `u_${Date.now()}`;

    // 5. SAVE to database
    const query = `
      INSERT INTO users (id, username, password, dept, role) 
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(query, [id, username, password, cleanDept, assignedRole]);

    console.log(
      `✅ User ${username} registered as ${assignedRole} for ${cleanDept}`,
    );

    res.status(201).json({
      success: true,
      role: assignedRole,
      dept: cleanDept,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    res
      .status(500)
      .json({ error: "Registration failed", message: error.message });
  }
};

// server/controllers/authController.js

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];

    // 2. Check password (Assuming plain text for now based on your DB screenshot)
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 🔴 THE MISSING PART: Increment the count in the database FIRST
    await db.query(
      "UPDATE users SET login_count = login_count + 1 WHERE id = ?",
      [user.id],
    );

    // 3. GET FRESH DATA: Fetch the user again to get the NEW login_count
    const [updatedRows] = await db.query("SELECT * FROM users WHERE id = ?", [
      user.id,
    ]);
    const updatedUser = updatedRows[0];

    // 4. Send the updated user (with the new login_count) to the frontend
    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      dept: updatedUser.dept,
      login_count: updatedUser.login_count, // 👈 This will now be 1, 2, 3...
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
