// models/ticket/deleteTicket.js
const db = require('../../config/db'); // Halimbawa kung SQL ang gamit mo

const deleteTicket = async (id) => {
    // query para i-delete sa database
    return await db.query("DELETE FROM tickets WHERE globalId = ?", [id]);
};

module.exports = deleteTicket;