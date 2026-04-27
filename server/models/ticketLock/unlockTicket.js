const { activeLocks } = require("./activeLocks");

/**
 * Manually unlocks a ticket and stops the active timer.
 */
module.exports = (ticketId) => {
  if (activeLocks.has(ticketId)) {
    clearTimeout(activeLocks.get(ticketId).timeoutId);
    activeLocks.delete(ticketId);
  }
  return { ticketId, username: null };
};
