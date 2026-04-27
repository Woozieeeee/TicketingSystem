// Notification Model - Individual exports for each database operation
module.exports = {
  getByUsername: require("./getByUsername"),
  findById: require("./findById"),
  markAsRead: require("./markAsRead"),
  create: require("./create"),
  delete: require("./delete"),
  createReminder: require("./createReminder"),
};
