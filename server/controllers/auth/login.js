const User = require("../../models/user");
const authMiddleware = require("../../middleware/authMiddleware");

module.exports = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // TEMPORARILY DISABLED: Allow login to create initial Head account
    // if (user.status === 'Pending') {
    //   console.log("⚠️ DEBUG: Harang dahil PENDING status!");
    //   return res.status(403).json({ 
    //     message: "Your account is still pending approval. Please wait for your Department Head to activate it." 
    //   });
    // }

    if (user.status === 'Suspended') {
      return res.status(403).json({ 
        message: "Your account has been suspended. Please contact the IT Department." 
      });
    }

    const isValidPassword = await User.verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    await User.incrementLoginCount(user.id);
    const { token, expires } = await authMiddleware.generateAndSaveToken(user.id);
    const updatedUser = await User.findById(user.id);

    // Set HttpOnly cookie with token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      dept: updatedUser.dept,
      login_count: updatedUser.login_count,
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};