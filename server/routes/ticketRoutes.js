// server/routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

// Add this line where your other router.put() and router.post() lines are:
router.put("/:id/remind", ticketController.remindTicket);

// GET all tickets (with optional filtering)
router.get("/", ticketController.getTickets);

// POST create new ticket
router.post("/", ticketController.createTicket);

// GET single ticket by ID
router.get("/:id", ticketController.getTicketById);

// PUT update ticket (e.g., status)
router.put("/:id", ticketController.updateTicket);
const ticket = require("../controllers/ticket");
const { verifyToken } = require("../middleware/authMiddleware");

// Apply token verification to all ticket routes
router.use(verifyToken);

// GET all tickets (with optional filtering)
router.get("/", ticket.getTickets);

// POST create new ticket
router.post("/", ticket.createTicket);

// GET single ticket by ID
router.get("/:id", ticket.getTicketById);

// PUT update ticket (e.g., status)
router.put("/:id", ticket.updateTicket);

// PUT send reminder for ticket
router.put("/:id/remind", ticket.remindTicket);

module.exports = router;
