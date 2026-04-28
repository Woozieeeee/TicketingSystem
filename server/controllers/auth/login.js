const User = require("../../models/user");
const { generateAndSaveToken } = require("../../middleware/authMiddleware");

/**
 * Login user and generate token
 * POST /api/auth/login
 */
module.exports = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Increment login count
    await User.incrementLoginCount(user.id);

    // Generate authentication token
    const { token, expires } = await generateAndSaveToken(user.id);

    // Get updated user data with new login count
    const updatedUser = await User.findById(user.id);

    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      dept: updatedUser.dept,
      login_count: updatedUser.login_count,
      token: token,
      token_expires: expires,
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
