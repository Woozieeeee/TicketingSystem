const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// POST Submit review for a ticket
router.post("/:ticketId", reviewController.submitReview);

// GET Get review by ticket ID
router.get("/ticket/:ticketId", reviewController.getReviewByTicketId);

// GET Get personnel performance stats
router.get("/stats/personnel/:assignedTo", reviewController.getPersonnelStats);

// GET Get department stats
router.get("/stats/department/:department", reviewController.getDepartmentStats);

// GET Get all personnel stats (for IT Head dashboard)
router.get("/stats/all", reviewController.getAllPersonnelStats);

// POST Confirm done (change ticket status from Resolved to Finished)
router.post("/confirm/:ticketId", reviewController.confirmDone);

// GET Get all reviews with filtering (for Reviews Management Page)
router.get("/all", reviewController.getAllReviews);

// GET Get reviews analytics (for Reviews Management Page)
router.get("/analytics", reviewController.getReviewsAnalytics);

module.exports = router;
