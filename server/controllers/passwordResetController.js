// server/controllers/passwordResetController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const activity = require("../lib/activityLogger");

/**
 * Request password reset - generates reset token
 */
exports.requestReset = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      // Don't reveal if user exists for security
      return res.status(200).json({ 
        message: "If the username exists, a reset link will be sent" 
      });
    }

    const user = rows[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRES_MS || '3600000'));

    // Store reset token in database (add column if needed)
    await db.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
      [resetToken, resetExpires, user.id]
    );

    // Log the reset request
    await activity.passwordResetRequested(req, { username: user.username });

    // In production, send email with reset link
    // For now, return the token (for development/testing only)
    res.status(200).json({ 
      message: "Password reset token generated",
      resetToken, // Only for development - remove in production
      resetExpires
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Failed to process reset request" });
  }
};

/**
 * Reset password using token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Find user with valid reset token
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const user = rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL, password_change_required = 0 WHERE id = ?",
      [hashedPassword, user.id]
    );

    // Log the password reset
    await activity.passwordResetCompleted(req, { username: user.username });

    res.status(200).json({ 
      message: "Password reset successful. Please login with your new password." 
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

/**
 * Verify reset token validity
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ valid: false });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ error: "Failed to verify token" });
  }
};
