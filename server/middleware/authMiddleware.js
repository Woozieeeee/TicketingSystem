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
    // Check HttpOnly cookie first, fallback to Authorization header
    let token = null;

    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Access denied. No token provided.",
        });
      }

      token = authHeader.substring(7); // Remove "Bearer " prefix
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

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
    // Check HttpOnly cookie first, fallback to Authorization header
    let token = null;

    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

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

/**
 * 🟢 Authorization middleware - check if user is Head of INFORMATION AND TECHNOLOGY OFFICE only
 * Restricts access to administrative endpoints (User Management)
 */
exports.requireITHead = (req, res, next) => {
  // 1. Siguraduhing dumaan muna sa verifyToken at may nakuhang req.user
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  // 2. I-validate ang Role at Departamento ng user
  const isHead = req.user.role === "Head";
  const isITDept = req.user.dept === "INFORMATION AND TECHNOLOGY OFFICE";

  if (!isHead || !isITDept) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Access restricted to Head of INFORMATION AND TECHNOLOGY OFFICE only.",
    });
  }

  // Lulusot sa susunod na function/controller kapag pumasa ang validation
  next();
};