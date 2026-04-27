const { activeLocks, LOCK_TIMEOUT } = require("./activeLocks");

/**
 * Locks a ticket and starts an auto-unlock timer.
 * If the ticket is already locked by the same user, it resets the timer.
 */
module.exports = (ticketId, username, onAutoUnlock) => {
  // Clear any existing timer for this specific ticket before setting a new one
  if (activeLocks.has(ticketId)) {
    clearTimeout(activeLocks.get(ticketId).timeoutId);
  }

  // Create a new timer that unlocks the ticket after 10 minutes
  const timeoutId = setTimeout(() => {
    const { unlockTicket } = require("./unlockTicket");
    unlockTicket(ticketId);
    if (onAutoUnlock) onAutoUnlock(ticketId);
    console.log(
      `⏰ Auto-unlock: Ticket ${ticketId} released due to inactivity.`,
    );
  }, LOCK_TIMEOUT);

  activeLocks.set(ticketId, { username, timeoutId });

  return { ticketId, username };
};
