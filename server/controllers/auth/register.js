const User = require("../../models/user");

/**
 * Register a new user
 * POST /api/auth/register
 */
module.exports = async (req, res) => {
  try {
    const { username, password, dept } = req.body;

    // Validate required fields
    if (!username || !password || !dept) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Clean department name to prevent duplicates
    const cleanDept = dept.trim().toUpperCase();

    // Check if this is the first user for this department
    const deptUserCount = await User.countByDept(cleanDept);
    const assignedRole = deptUserCount === 0 ? "Head" : "User";

    // Generate unique user ID
    const id = `u_${Date.now()}`;

    // Create user in database
    await User.create({
      id,
      username,
      password,
      role: assignedRole,
      dept: cleanDept,
    });

    console.log(`✅ User ${username} registered as ${assignedRole} for ${cleanDept}`);

    return res.status(201).json({
      success: true,
      role: assignedRole,
      dept: cleanDept,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    return res.status(500).json({
      error: "Registration failed",
      message: error.message,
    });
  }
};
