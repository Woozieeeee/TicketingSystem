/**
 * Monitoring Middleware
 *
 * Express middleware and utility functions for request-level monitoring:
 *   - logActivity        — middleware: logs the current request as an activity
 *   - detectSuspiciousActivity — middleware: flags suspicious user-agents / URLs
 *   - logPerformance     — middleware: records request duration to system_metrics
 *   - logLoginAttempt    — standalone: records a login attempt to login_attempts
 *   - logSecurityEvent   — standalone: writes to system_alerts (delegated to securityAlerts service)
 */

const db = require('../config/db');
const security = require('../lib/securityAlerts');

// ---------------------------------------------------------------------------
// Middleware: log the current request as a user activity
// ---------------------------------------------------------------------------

const logActivity = (action, resource = null) => {
  return async (req, _res, next) => {
    try {
      const user     = req.user;
      const username = user?.username || 'anonymous';
      const role     = user?.role     || 'guest';

      await db.query(
        `INSERT INTO activity_logs
           (username, action, resource, details, ip_address, user_agent, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          action,
          resource,
          JSON.stringify({ method: req.method, url: req.originalUrl }),
          req.ip,
          req.get('User-Agent'),
          role,
        ],
      );
    } catch (err) {
      console.error(`[monitoring] logActivity failed (${action}):`, err.message);
    }

    next();
  };
};

// ---------------------------------------------------------------------------
// Middleware: flag suspicious user-agents / URL patterns
// ---------------------------------------------------------------------------

const SUSPICIOUS_PATTERNS = [/bot/i, /crawl/i, /scan/i, /sql/i, /script/i];

const detectSuspiciousActivity = (req, _res, next) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const url       = req.originalUrl      || '';

    const isSuspicious = SUSPICIOUS_PATTERNS.some(
      (p) => p.test(userAgent) || p.test(url),
    );

    if (isSuspicious) {
      security
        .raise('SUSPICIOUS_ACTIVITY', {
          ip: req.ip,
          userAgent,
          url,
          message: `Suspicious request detected from ${req.ip}`,
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error('[monitoring] detectSuspiciousActivity error:', err.message);
  }

  next();
};

// ---------------------------------------------------------------------------
// Middleware: record request duration
// ---------------------------------------------------------------------------

const SLOW_REQUEST_MS = 1000;

const logPerformance = (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;

    if (duration > SLOW_REQUEST_MS) {
      console.warn(
        `[monitoring] slow request: ${req.method} ${req.originalUrl} — ${duration}ms`,
      );
    }

    try {
      await db.query(
        `INSERT INTO system_metrics
           (metric_name, metric_value, metric_unit, tags, recorded_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          'request_duration',
          duration,
          'ms',
          JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
          }),
        ],
      );
    } catch (err) {
      // Best-effort — don't break the response
    }
  });

  next();
};

// ---------------------------------------------------------------------------
// Standalone: record a login attempt
// ---------------------------------------------------------------------------

const logLoginAttempt = async (username, success, ip, userAgent, failureReason = null) => {
  try {
    await db.query(
      `INSERT INTO login_attempts
         (username, success, ip_address, user_agent, failure_reason)
       VALUES (?, ?, ?, ?, ?)`,
      [username, success, ip, userAgent, failureReason],
    );
  } catch (err) {
    console.error('[monitoring] logLoginAttempt failed:', err.message);
  }
};

// ---------------------------------------------------------------------------
// Standalone: delegate to securityAlerts service (kept for backward compat)
// ---------------------------------------------------------------------------

const logSecurityEvent = (event, details = {}) => security.raise(event, details);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  logActivity,
  detectSuspiciousActivity,
  logPerformance,
  logLoginAttempt,
  logSecurityEvent,
};