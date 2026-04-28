const ticketLockModel = require("../../models/ticketLock");

/**
 * Handle start editing - lock ticket
 */
module.exports = (io, socket, data) => {
  const { ticketId, username } = data;

  // We pass a callback to the model so it can emit the unlock event if the timer expires
  const lock = ticketLockModel.lockTicket(ticketId, username, (autoUnlockedId) => {
    io.emit("user_typing_lock", { ticketId: autoUnlockedId, username: null });
  });

  socket.broadcast.emit("user_typing_lock", lock);
  console.log(`🔒 Ticket ${ticketId} locked by ${username}`);
};
