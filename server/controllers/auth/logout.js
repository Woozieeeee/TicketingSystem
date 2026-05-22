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

    // Clear HttpOnly cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

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
