const ticketLockModel = require("../../models/ticketLock");

/**
 * Handle stop editing - unlock ticket
 */
module.exports = (io, socket, data) => {
  const { ticketId } = data;
  const unlock = ticketLockModel.unlockTicket(ticketId);

  socket.broadcast.emit("user_typing_lock", unlock);
  console.log(`🔓 Ticket ${ticketId} released`);
};
