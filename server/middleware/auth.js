const userModel = require('../models/user');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // For now, we'll use a simple token validation
    // In production, you should use JWT or similar
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

// Authorization middleware - check if user is Admin or Staff
const requireAdminOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userRole = req.user.role;
  if (userRole !== 'Admin' && userRole !== 'Staff') {
    return res.status(403).json({ error: 'Admin or Staff access required' });
  }

  next();
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
