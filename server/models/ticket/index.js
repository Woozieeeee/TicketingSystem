// Ticket Model - Individual exports for each database operation
module.exports = {
  getAll: require("./getAll"),
  getTicketsForHead: require("./getTicketsForHead"),
  getTicketsForUser: require("./getTicketsForUser"),
  create: require("./create"),
  findById: require("./findById"),
  update: require("./update"),
  updateReminderStatus: require("./updateReminderStatus"),
  getDepartmentHeads: require("./getDepartmentHeads"),
};
