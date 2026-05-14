/**
 * SecurityAlertService — Centralised service for raising and managing security
 * alerts in the `system_alerts` table.
 *
 * Severity is determined automatically from the event type so callers never
 * have to think about it.  All writes are fire-and-forget; a DB failure will
 * never break the parent request.
 *
 * Usage:
 *   const security = require('../lib/securityAlerts');
 *   await security.raise('FAILED_LOGIN', { username, ip, reason });
 */

const db = require('../config/db');

// ---------------------------------------------------------------------------
// Severity mapping — single source of truth
// ---------------------------------------------------------------------------

const SEVERITY = {
  BRUTE_FORCE_SUSPECTED: 'CRITICAL',
  ROLE_CHANGED:          'HIGH',
  PERMISSION_VIOLATION:  'HIGH',
  SUSPICIOUS_ACTIVITY:   'HIGH',
  USER_DELETED:          'MEDIUM',
  FAILED_LOGIN:          'LOW',
};

const DEFAULT_SEVERITY = 'MEDIUM';

// ---------------------------------------------------------------------------
// Brute-force detection config
// ---------------------------------------------------------------------------

const BRUTE_FORCE_WINDOW_MINUTES = 15;
const BRUTE_FORCE_THRESHOLD      = 5;

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Raise a security alert.
 *
 * @param {string} type    One of the SEVERITY keys, or any custom string.
 * @param {object} details Arbitrary context — always stored as JSON.
 */
const raise = async (type, details = {}) => {
  try {
    const severity = SEVERITY[type] || DEFAULT_SEVERITY;
    const message  = details.message || type;

    await db.query(
      `INSERT INTO system_alerts (type, severity, message, details, username)
       VALUES (?, ?, ?, ?, ?)`,
      [type, severity, message, JSON.stringify(details), details.username || 'system'],
    );
  } catch (err) {
    console.error(`[SecurityAlerts] write failed (${type}):`, err.message);
  }
};

// ---------------------------------------------------------------------------
// Semantic helpers
// ---------------------------------------------------------------------------

/**
 * Record a failed login and, if the threshold is crossed, automatically
 * escalate to a BRUTE_FORCE_SUSPECTED alert.
 */
const failedLogin = async ({ username, reason, ip }) => {
  await raise('FAILED_LOGIN', { username, reason, ip, message: `Failed login for ${username}: ${reason}` });

  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM login_attempts
       WHERE username = ? AND success = FALSE
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [username, BRUTE_FORCE_WINDOW_MINUTES],
    );

    if (rows[0].cnt >= BRUTE_FORCE_THRESHOLD) {
      await raise('BRUTE_FORCE_SUSPECTED', {
        username,
        ip,
        attempts: rows[0].cnt,
        message: `${rows[0].cnt} failed login attempts for "${username}" in the last ${BRUTE_FORCE_WINDOW_MINUTES} minutes`,
      });
    }
  } catch (err) {
    // Brute-force check is best-effort
    console.error('[SecurityAlerts] brute-force check failed:', err.message);
  }
};

const roleChanged = async ({ actor, targetUser, previousRole, newRole }) =>
  raise('ROLE_CHANGED', {
    username: actor,
    targetUser,
    previousRole,
    newRole,
    message: `Role changed for ${targetUser}: ${previousRole} \u2192 ${newRole}`,
  });

const userDeleted = async ({ actor, deletedUser, deletedRole }) =>
  raise('USER_DELETED', {
    username: actor,
    deletedUser,
    deletedRole,
    message: `User ${deletedUser} (${deletedRole}) was deleted by ${actor}`,
  });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  raise,
  failedLogin,
  roleChanged,
  userDeleted,
  SEVERITY,
};
