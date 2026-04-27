// Main Models Index - Organized by feature
// Each feature has individual files for each database operation

module.exports = {
  User: require("./user"),
  Notification: require("./notification"),
  Ticket: require("./ticket"),
  chatModel: require("./chat"),
  ticketLockModel: require("./ticketLock"),
};
