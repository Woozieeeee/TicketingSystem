// server/controllers/socketController.js
const socketModel = require("../models/socketModel");

exports.handleStartEdit = (io, socket, data) => {
  const { ticketId, username } = data;

  // We pass a callback to the model so it can emit the unlock event if the timer expires
  const lock = socketModel.lockTicket(ticketId, username, (autoUnlockedId) => {
    io.emit("user_typing_lock", { ticketId: autoUnlockedId, username: null });
  });

  socket.broadcast.emit("user_typing_lock", lock);
  console.log(`🔒 Ticket ${ticketId} locked by ${username}`);
};

exports.handleStopEdit = (io, socket, data) => {
  const { ticketId } = data;
  const unlock = socketModel.unlockTicket(ticketId);

  socket.broadcast.emit("user_typing_lock", unlock);
  console.log(`🔓 Ticket ${ticketId} released`);
};

exports.handleDisconnect = (socket) => {
  console.log(`🔌 Socket disconnected: ${socket.id}`);
};
