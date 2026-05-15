const userModel = require('../models/user');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Read token from httpOnly cookie first, fallback to Authorization header
    let token = null;
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const user = await userModel.findByToken(token);
    
    if (!user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Authentication Error:', error.message);
    return res.status(403).json({ error: 'Authentication failed' });
  }
};

/**
 * Authorization middleware - check if user is Admin, Staff, or Head
 * This allows the 'Head' role to access routes protected by requireAdminOrStaff
 */
const requireAdminOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const allowedRoles = ['Admin', 'Staff', 'Head'];
  
  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
    // Standardizing JSON response to match your other middleware
    res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }
};

// Authorization middleware - check if user is Admin only
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdminOrStaff,
  requireAdmin
};