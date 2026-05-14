const db = require('../config/db');

// Log user activities
const logActivity = (action, resource = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const username = user?.username || 'anonymous';
      const userId = user?.id || null;
      const role = user?.role || 'guest';
      
      // For now, just log to console since monitoring tables might not exist
      console.log(`🔍 ACTIVITY: ${username} (${role}) - ${action} - ${resource || 'N/A'}`);
      
      // Try to log to database if tables exist
      try {
        await db.query(`
          INSERT INTO activity_logs (username, action, resource, details, ip_address, user_agent, role)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          username,
          action,
          resource,
          JSON.stringify({
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date().toISOString()
          }),
          req.ip,
          req.get('User-Agent'),
          role
        ]);
      } catch (dbError) {
        // Silently ignore if monitoring tables don't exist
        console.log('📝 Activity logging to DB skipped (tables may not exist)');
      }
      
      next();
    } catch (error) {
      console.error('❌ Activity logging error:', error);
      next();
    }
  };
};

// Detect suspicious activities
const detectSuspiciousActivity = (req, res, next) => {
  try {
    const user = req.user;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    // Simple suspicious activity detection
    const suspiciousPatterns = [
      /bot/i,
      /crawl/i,
      /scan/i,
      /sql/i,
      /script/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(userAgent) || pattern.test(req.originalUrl)
    );
    
    if (isSuspicious) {
      console.log(`🚨 SUSPICIOUS ACTIVITY: ${ip} - ${userAgent}`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Suspicious activity detection error:', error);
    next();
  }
};

// Log performance metrics
const logPerformance = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    console.log(`⚡ PERFORMANCE: ${req.method} ${req.originalUrl} - ${status} - ${duration}ms`);
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.log(`🐌 SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    // Store performance metrics in database
    try {
      await db.query(`
        INSERT INTO system_metrics (metric_name, metric_value, metric_unit, tags, recorded_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        'request_duration',
        duration,
        'ms',
        JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          status: status,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        })
      ]);
    } catch (dbError) {
      console.log('📝 Performance logging to DB skipped (table may not exist)');
    }
  });
  
  next();
};

// Log login attempts
const logLoginAttempt = async (username, success, ip, userAgent, failureReason = null) => {
  try {
    console.log(`🔐 LOGIN ATTEMPT: ${username} - ${success ? 'SUCCESS' : 'FAILED'} - ${ip}`);
    
    // Try to log to database
    try {
      await db.query(`
        INSERT INTO login_attempts (username, success, ip_address, user_agent, failure_reason)
        VALUES (?, ?, ?, ?, ?)
      `, [username, success, ip, userAgent, failureReason]);
    } catch (dbError) {
      console.log('📝 Login attempt logging to DB skipped (tables may not exist)');
    }
  } catch (error) {
    console.error('❌ Login attempt logging error:', error);
  }
};

// Log security events
const logSecurityEvent = async (event, details = {}) => {
  try {
    console.log(`🛡️ SECURITY EVENT: ${event}`, details);

    // Determine severity based on event type
    const severityMap = {
      'FAILED_LOGIN': 'LOW',
      'BRUTE_FORCE_SUSPECTED': 'CRITICAL',
      'ROLE_CHANGED': 'HIGH',
      'USER_DELETED': 'MEDIUM',
      'PERMISSION_VIOLATION': 'HIGH',
      'SUSPICIOUS_ACTIVITY': 'HIGH',
    };
    const severity = severityMap[event] || 'MEDIUM';
    const message = details.message || event;
    
    // Try to log to database
    try {
      await db.query(`
        INSERT INTO system_alerts (type, severity, message, details, username)
        VALUES (?, ?, ?, ?, ?)
      `, [
        event,
        severity,
        message,
        JSON.stringify(details),
        details.username || 'system'
      ]);
    } catch (dbError) {
      console.log('📝 Security event logging to DB skipped (tables may not exist)');
    }
  } catch (error) {
    console.error('❌ Security event logging error:', error);
  }
};

module.exports = {
  logActivity,
  detectSuspiciousActivity,
  logPerformance,
  logLoginAttempt,
  logSecurityEvent
};
