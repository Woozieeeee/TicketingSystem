const { activeLocks } = require("./activeLocks");

/**
 * Get the current lock status for a ticket
 */
module.exports = (ticketId) => {
  const lock = activeLocks.get(ticketId);
  return lock ? lock.username : null;
};
