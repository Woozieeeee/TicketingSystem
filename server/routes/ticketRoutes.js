// server/routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const ticket = require("../controllers/ticketController"); 



const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES (No Token Required)
// ==========================================
// Nilagay natin ito sa itaas ng verifyToken para makapasok ang tawag ng Google Apps Script
router.post('/webhook/review', ticket.handleGoogleFormWebhook);


// ==========================================
// PROTECTED ROUTES (Requires Token Verification)
// ==========================================
// Apply token verification to all ticket routes below this line
router.use(verifyToken);

router.get("/:id/survey-status", ticket.getSurveyStatus);
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

router.delete('/:id', ticket.deleteTicket);

module.exports = router;