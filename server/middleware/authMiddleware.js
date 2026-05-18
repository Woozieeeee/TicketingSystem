// Token Authentication Middleware
const User = require("../models/user.js");
const crypto = require("crypto");
const db = require("../config/db");

// Generate a unique token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Extract token from request — cookie first, then Authorization header
 */
function extractToken(req) {
  // 1. Check httpOnly cookie
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  // 2. Fallback to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Middleware to verify token on protected routes
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Check if token exists and is not expired
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
  expires.setHours(expires.getHours() + 24);

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
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Check token validity
    const [rows] = await db.query(
      "SELECT id, username FROM users WHERE auth_token = ? AND (token_expires IS NULL OR token_expires > NOW())",
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    // Return user data from cookies (sensitive data) and database (username)
    return res.status(200).json({
      success: true,
      user: {
        id: req.cookies.user_id,
        username: rows[0].username,
        role: req.cookies.user_role,
        dept: req.cookies.user_dept,
        login_count: req.cookies.login_count,
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
