// Chat Model - Individual exports for each database operation
module.exports = {
  getMessagesByTicket: require("./getMessagesByTicket"),
  saveMessage: require("./saveMessage"),
  deleteMessage: require("./deleteMessage"),
  markAsRead: require("./markAsRead"),
  saveSystemMessage: require("./saveSystemMessage"),
};
