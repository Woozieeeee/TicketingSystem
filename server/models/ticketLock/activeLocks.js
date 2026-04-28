// In-memory store for active ticket locks
// Structure: Map<ticketId, { username: string, timeoutId: Timeout }>
const activeLocks = new Map();

// 10 minutes in milliseconds
const LOCK_TIMEOUT = 10 * 60 * 1000;

module.exports = { activeLocks, LOCK_TIMEOUT };
