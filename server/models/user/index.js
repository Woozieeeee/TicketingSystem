// User Model - Individual exports for each database operation
module.exports = {
  create: require("./create"),
  findByUsername: require("./findByUsername"),
  findById: require("./findById"),
  findByDept: require("./findByDept"),
  countByDept: require("./countByDept"),
  incrementLoginCount: require("./incrementLoginCount"),
  updateToken: require("./updateToken"),
  clearToken: require("./clearToken"),
};
