// Ticket Lock Model - Individual exports for each function
module.exports = {
  activeLocks: require("./activeLocks").activeLocks,
  LOCK_TIMEOUT: require("./activeLocks").LOCK_TIMEOUT,
  lockTicket: require("./lockTicket"),
  unlockTicket: require("./unlockTicket"),
  getLock: require("./getLock"),
};
