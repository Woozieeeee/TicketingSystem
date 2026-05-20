// server/routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const ticket = require("../controllers/ticket");
const { verifyToken } = require("../middleware/authMiddleware");
const { validateBody, validateId } = require("../middleware/validation");
const { logActivity } = require("../middleware/monitoring");

// Apply token verification to all ticket routes
router.use(verifyToken);

// GET all tickets (with optional filtering)
router.get("/", logActivity('VIEW_TICKETS', 'TICKET'), ticket.getTickets);

// POST create new ticket
router.post("/", logActivity('CREATE_TICKET', 'TICKET'), validateBody('createTicket'), ticket.createTicket);

// GET single ticket by ID
router.get("/:id", validateId, logActivity('VIEW_TICKET_DETAIL', 'TICKET'), ticket.getTicketById);

// PUT update ticket (e.g., status)
router.put("/:id", validateId, logActivity('UPDATE_TICKET', 'TICKET'), validateBody('updateTicket'), ticket.updateTicket);

// PUT send reminder for ticket
router.put("/:id/remind", validateId, logActivity('SEND_REMINDER', 'TICKET'), ticket.remindTicket);

module.exports = router;
