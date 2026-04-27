// Helper to safely parse booleans
module.exports = (val) =>
  val === true || val === "true" || val === 1 || val === "1";
