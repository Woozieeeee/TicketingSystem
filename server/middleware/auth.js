const userModel = require('../models/user');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Read token from httpOnly cookie first, fallback to Authorization header
    let token = null;

    // 🟢 DEFENSIVE CHECK: Sinisigurong may cookie parser at may auth_token
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else {
      const authHeader = req.headers['authorization'];
      // Sinisigurong "Bearer <token>" ang format bago kunin ang string index
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.split(' ')[1];
      }
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
 * Authorization middleware - check if user is Admin or Head
 * This allows the 'Head' role to access routes protected by requireAdminOrHead
 */
const requireAdminOrHead = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const allowedRoles = ['Admin', 'Head'];
 
  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
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

/**
 * Authorization middleware - check if user is Head of INFORMATION AND TECHNOLOGY OFFICE only
 * This restricts access to only the head of the IT department
 */
const requireITHead = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const isHead = req.user.role === 'Head';
  // 🟢 CASE-INSENSITIVE CHECK: Para kung sakaling may typo (e.g. lowercase) sa db, gagana pa rin
  const isITDept = req.user.dept?.toUpperCase() === 'INFORMATION AND TECHNOLOGY OFFICE';

  if (!isHead || !isITDept) {
    return res.status(403).json({
      error: 'Forbidden: Access restricted to Head of INFORMATION AND TECHNOLOGY OFFICE only'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdminOrHead,
  requireAdmin,
  requireITHead
};