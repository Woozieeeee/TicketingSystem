// In-memory state for typing indicators (Doesn't touch DB)
// Shared across chat controllers
const activeTypingStatus = {};

module.exports = activeTypingStatus;
