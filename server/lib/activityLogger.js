/**
 * ActivityLogger — Centralized service for recording user activity in the system.
 */

const db = require('../config/db');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Persist a single activity row. Never throws.
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
    // 🟢 HYBRID RESOLVER: Hahanapin ang User ID at Username sa kahit anong Auth setup ninyong dalawa
    const finalUserId = req?.user?.id || req?.tokenUser?.id || req?.userId || null;
    const finalUsername = username || req?.user?.username || req?.tokenUser?.username || 'system';
    const finalRole = role || req?.user?.role || req?.tokenUser?.role || null;

    await db.query(
      `INSERT INTO activity_logs
         (user_id, username, action, resource, resource_id, details, ip_address, user_agent, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUserId,
        finalUsername,
        action,
        resource,
        resourceId,
        // Sinisigurong valid JSON string kahit anong klase ng data ang ihagis ng co-worker mo
        Object.keys(details).length > 0 ? JSON.stringify(details) : '{}',
        req?.ip || req?.socket?.remoteAddress || null,
        req?.headers?.['user-agent'] || null, 
        finalRole,
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
    username: username || null, // Hahayaan nating mag-fallback sa central resolver kung null
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
  });

const ticketUpdated = async (req, { id, title }) =>
  record({
    action: 'TICKET_UPDATED',
    resource: 'TICKET',
    resourceId: id,
    details: { title },
    req,
  });

const ticketStatusChanged = async (req, { id, title, oldStatus, newStatus }) =>
  record({
    action: 'TICKET_STATUS_CHANGED',
    resource: 'TICKET',
    resourceId: id,
    details: { title, oldStatus, newStatus },
    req,
  });

// ---------------------------------------------------------------------------
// User-management events
// ---------------------------------------------------------------------------

const userCreated = async (req, { userId, newUser, role, dept }) =>
  record({
    action: 'USER_CREATED',
    resource: 'USER',
    resourceId: userId,
    details: { newUser, role, dept },
    req,
  });

const userUpdated = async (req, { userId, targetUser, role, dept, previousRole }) =>
  record({
    action: 'USER_UPDATED',
    resource: 'USER',
    resourceId: userId,
    details: { targetUser, role, dept, previousRole },
    req,
  });

const userDeleted = async (req, { userId, deletedUser, deletedRole }) =>
  record({
    action: 'USER_DELETED',
    resource: 'USER',
    resourceId: userId,
    details: { deletedUser, deletedRole },
    req,
  });

// ---------------------------------------------------------------------------
// Password reset events
// ---------------------------------------------------------------------------

const passwordResetRequested = async (req, { username }) =>
  record({
    username,
    action: 'PASSWORD_RESET_REQUESTED',
    resource: 'AUTH',
    req,
  });

const passwordResetCompleted = async (req, { username }) =>
  record({
    username,
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