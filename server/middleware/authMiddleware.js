// Token Authentication Middleware
const User = require("../models/user");
const crypto = require("crypto");
const db = require("../config/db");

// Generate a unique token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Middleware to verify token on protected routes
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Check if token exists and is not expired (using raw query for complex condition)
    const [rows] = await db.query(
      "SELECT * FROM users WHERE auth_token = ? AND (token_expires IS NULL OR token_expires > NOW())",
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }

    // Attach user info to request
    req.user = rows[0];
    req.token = token;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

/**
 * Generate and save new token for user
 */
exports.generateAndSaveToken = async (userId) => {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

  await User.updateToken(userId, token, expires);

  return { token, expires };
};

/**
 * Clear token (logout)
 */
exports.clearToken = async (userId) => {
  await User.clearToken(userId);
};

/**
 * Check if user has valid session
 */
exports.validateSession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);

    // Check token validity (using raw query for complex condition)
    const [rows] = await db.query(
      "SELECT id, username, role, dept FROM users WHERE auth_token = ? AND (token_expires IS NULL OR token_expires > NOW())",
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    return res.status(200).json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
