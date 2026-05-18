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

    // Set httpOnly cookies for sensitive data
    res.cookie('user_id', updatedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
    console.error("❌ Login Error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
