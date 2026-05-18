const User = require("../../models/user");

/**
 * Logout user and clear token
 * POST /api/auth/logout
 */
module.exports = async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId) {
      await User.clearToken(userId);
    }

    // Clear httpOnly cookies
    res.clearCookie('auth_token');
    res.clearCookie('user_id');
    res.clearCookie('user_role');
    res.clearCookie('user_dept');
    res.clearCookie('login_count');

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("❌ Logout Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
};
