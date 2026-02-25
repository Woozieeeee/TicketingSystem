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

module.exports = router;
