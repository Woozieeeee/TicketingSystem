// server/routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const ticket = require("../controllers/ticket");
const { verifyToken } = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/monitoring");

// Apply token verification to all ticket routes
router.use(verifyToken);

// GET all tickets (with optional filtering)
router.get("/", logActivity('VIEW_TICKETS', 'TICKET'), ticket.getTickets);

// POST create new ticket
router.post("/", logActivity('CREATE_TICKET', 'TICKET'), ticket.createTicket);

// GET single ticket by ID
router.get("/:id", logActivity('VIEW_TICKET_DETAIL', 'TICKET'), ticket.getTicketById);

// PUT update ticket (e.g., status)
router.put("/:id", logActivity('UPDATE_TICKET', 'TICKET'), ticket.updateTicket);

// PUT send reminder for ticket
router.put("/:id/remind", logActivity('SEND_REMINDER', 'TICKET'), ticket.remindTicket);

module.exports = router;
