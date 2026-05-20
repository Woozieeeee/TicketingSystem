/**
 * ActivityLogger — Centralized service for recording user activity in the system.
 *
 * Every mutation that matters (login, ticket CRUD, user management) should call
 * one of the semantic helpers below.  The helpers normalise the data, write to
 * the `activity_logs` table, and silently swallow DB errors so the main request
 * is never affected.
 *
 * Usage:
 *   const activity = require('../lib/activityLogger');
 *   await activity.loginSuccess(req, user);
 */

const db = require('../config/db');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Persist a single activity row.  Never throws — failures are logged to the
 * console and swallowed so the caller's request is not interrupted.
 */
const record = async ({
  username,
  action,
  resource,
  resourceId = null,
  details = {},
  req = null,
  role = null,
}) => {
  try {
    await db.query(
      `INSERT INTO activity_logs
         (username, action, resource, resource_id, details, ip_address, user_agent, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        action,
        resource,
        resourceId,
        JSON.stringify(details),
        req?.ip || null,
        req?.get?.('User-Agent') || null,
        role,
      ],
    );
  } catch (err) {
    console.error(`[ActivityLogger] write failed (${action}):`, err.message);
  }
};

// ---------------------------------------------------------------------------
// Auth events
// ---------------------------------------------------------------------------

const loginSuccess = async (req, user) =>
  record({
    username: user.username,
    action: 'LOGIN_SUCCESS',
    resource: 'AUTH',
    details: { loginCount: user.login_count },
    req,
    role: user.role,
  });

const logout = async (req, username) =>
  record({
    username: username || 'unknown',
    action: 'LOGOUT',
    resource: 'AUTH',
    req,
  });

const userRegistered = async (req, { username, role, dept }) =>
  record({
    username,
    action: 'USER_REGISTERED',
    resource: 'AUTH',
    details: { role, dept },
    req,
    role,
  });

// ---------------------------------------------------------------------------
// Ticket events
// ---------------------------------------------------------------------------

const ticketCreated = async (req, { id, title, category, dept, createdBy }) =>
  record({
    username: createdBy,
    action: 'TICKET_CREATED',
    resource: 'TICKET',
    resourceId: id,
    details: { title, category, dept },
    req,
    role: req?.user?.role || 'User',
  });

const ticketUpdated = async (req, { id, title }) =>
  record({
    username: req?.user?.username || 'unknown',
    action: 'TICKET_UPDATED',
    resource: 'TICKET',
    resourceId: id,
    details: { title },
    req,
    role: req?.user?.role || 'User',
  });

const ticketStatusChanged = async (req, { id, title, oldStatus, newStatus }) =>
  record({
    username: req?.user?.username || 'unknown',
    action: 'TICKET_STATUS_CHANGED',
    resource: 'TICKET',
    resourceId: id,
    details: { title, oldStatus, newStatus },
    req,
    role: req?.user?.role || 'User',
  });

// ---------------------------------------------------------------------------
// User-management events
// ---------------------------------------------------------------------------

const userCreated = async (req, { userId, newUser, role, dept }) =>
  record({
    username: req?.user?.username || 'system',
    action: 'USER_CREATED',
    resource: 'USER',
    resourceId: userId,
    details: { newUser, role, dept },
    req,
    role: req?.user?.role || 'Admin',
  });

const userUpdated = async (req, { userId, targetUser, role, dept, previousRole }) =>
  record({
    username: req?.user?.username || 'system',
    action: 'USER_UPDATED',
    resource: 'USER',
    resourceId: userId,
    details: { targetUser, role, dept, previousRole },
    req,
    role: req?.user?.role || 'Admin',
  });

const userDeleted = async (req, { userId, deletedUser, deletedRole }) =>
  record({
    username: req?.user?.username || 'system',
    action: 'USER_DELETED',
    resource: 'USER',
    resourceId: userId,
    details: { deletedUser, deletedRole },
    req,
    role: req?.user?.role || 'Admin',
  });

// ---------------------------------------------------------------------------
// Password reset events
// ---------------------------------------------------------------------------

const passwordResetRequested = async (req, { username }) =>
  record({
    username: username || 'unknown',
    action: 'PASSWORD_RESET_REQUESTED',
    resource: 'AUTH',
    req,
  });

const passwordResetCompleted = async (req, { username }) =>
  record({
    username: username || 'unknown',
    action: 'PASSWORD_RESET_COMPLETED',
    resource: 'AUTH',
    req,
  });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  record,
  loginSuccess,
  logout,
  userRegistered,
  ticketCreated,
  ticketUpdated,
  ticketStatusChanged,
  userCreated,
  userUpdated,
  userDeleted,
  passwordResetRequested,
  passwordResetCompleted,
};
