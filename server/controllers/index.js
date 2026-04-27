// Main Controllers Index - Organized by feature
// Each feature has individual files for each export

module.exports = {
  auth: require("./auth"),
  chat: require("./chat"),
  notification: require("./notification"),
  ticket: require("./ticket"),
  ticketLock: require("./ticketLock"),
};
