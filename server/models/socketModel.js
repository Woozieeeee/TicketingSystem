// server/models/socketModel.js

// In-memory store for active ticket locks
// Structure: Map<ticketId, { username: string, timeoutId: Timeout }>
const activeLocks = new Map();

// 10 minutes in milliseconds
const LOCK_TIMEOUT = 10 * 60 * 1000;

/**
 * Locks a ticket and starts an auto-unlock timer.
 * If the ticket is already locked by the same user, it resets the timer.
 */
exports.lockTicket = (ticketId, username, onAutoUnlock) => {
  // Clear any existing timer for this specific ticket before setting a new one
  if (activeLocks.has(ticketId)) {
    clearTimeout(activeLocks.get(ticketId).timeoutId);
  }

  // Create a new timer that unlocks the ticket after 10 minutes
  const timeoutId = setTimeout(() => {
    this.unlockTicket(ticketId);
    if (onAutoUnlock) onAutoUnlock(ticketId);
    console.log(
      `⏰ Auto-unlock: Ticket ${ticketId} released due to inactivity.`,
    );
  }, LOCK_TIMEOUT);

  activeLocks.set(ticketId, { username, timeoutId });

  return { ticketId, username };
};

/**
 * Manually unlocks a ticket and stops the active timer.
 */
exports.unlockTicket = (ticketId) => {
  if (activeLocks.has(ticketId)) {
    clearTimeout(activeLocks.get(ticketId).timeoutId);
    activeLocks.delete(ticketId);
  }
  return { ticketId, username: null };
};

exports.getLock = (ticketId) => {
  const lock = activeLocks.get(ticketId);
  return lock ? lock.username : null;
};
