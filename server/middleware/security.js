// server/middleware/security.js
// Centralized security middleware

const rateLimit = require("express-rate-limit");

// --- Rate Limiters ---

// Login: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

// Registration: 3 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many accounts created. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Input Sanitization ---

// Strip HTML tags from string values to prevent XSS
function stripHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

// Recursively sanitize all string values in an object
function sanitizeObject(obj) {
  if (typeof obj === "string") return stripHtml(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

// Middleware to sanitize request body and query params
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  next();
};

// --- Password Validation ---

function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  return errors;
}

// Middleware for password validation on registration/password change
const requireStrongPassword = (req, res, next) => {
  const password = req.body?.password;
  if (!password) return next();

  const errors = validatePassword(password);
  if (errors.length > 0) {
    return res.status(400).json({
      error: "Password does not meet requirements",
      details: errors,
    });
  }
  next();
};

// --- Security Headers (lightweight alternative to helmet) ---

const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Enable XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Restrict permissions
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  // Remove Express fingerprint
  res.removeHeader("X-Powered-By");
  next();
};

// --- Token Cleanup ---

async function cleanupExpiredTokens(db) {
  try {
    const [result] = await db.query(
      "UPDATE users SET auth_token = NULL, token_expires = NULL WHERE token_expires < NOW() AND auth_token IS NOT NULL",
    );
    if (result.affectedRows > 0) {
      console.log(`✓ Cleaned up ${result.affectedRows} expired token(s)`);
    }
  } catch (error) {
    console.error("Token cleanup error:", error.message);
  }
}

// Start periodic token cleanup (every 30 minutes)
function startTokenCleanup(db) {
  cleanupExpiredTokens(db);
  setInterval(() => cleanupExpiredTokens(db), 30 * 60 * 1000);
}

module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  sanitizeInput,
  validatePassword,
  requireStrongPassword,
  securityHeaders,
  cleanupExpiredTokens,
  startTokenCleanup,
};
