const reviewModel = require("../models/reviewModel");
const ticketModel = require("../models/ticketModel");

exports.submitReview = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { rating, comment, reviewer, reviewer_role, assigned_to, department } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (!reviewer || !reviewer_role || !assigned_to || !department) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if ticket exists and is in Resolved status
    const ticket = await ticketModel.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    console.log("Review submission debug - Ticket ID:", ticketId);
    console.log("Review submission debug - Ticket status:", ticket.status);
    console.log("Review submission debug - Ticket status type:", typeof ticket.status);
    console.log("Review submission debug - Status comparison:", ticket.status === "Resolved");

    // Case-insensitive and whitespace-insensitive status check
    const normalizedStatus = ticket.status ? ticket.status.trim().toLowerCase() : "";
    if (normalizedStatus !== "resolved") {
      return res.status(400).json({ error: "Ticket must be in Resolved status to submit review" });
    }

    // Check if reviewer is the ticket owner
    if (ticket.createdBy !== reviewer) {
      return res.status(403).json({ error: "Only ticket owner can submit review" });
    }

    // Check if review already exists for this ticket
    const existingReview = await reviewModel.getReviewByTicketId(ticketId);
    if (existingReview) {
      return res.status(400).json({ error: "Review already submitted for this ticket" });
    }

    // Create review
    const reviewData = {
      ticket_id: ticketId,
      reviewer,
      reviewer_role,
      assigned_to,
      department,
      rating,
      comment: comment || null,
    };

    const reviewId = await reviewModel.createReview(reviewData);

    if (!reviewId) {
      return res.status(500).json({ error: "Failed to create review" });
    }

    // Create activity log entry (review submitted, but ticket stays Resolved)
    await ticketModel.createActivityLog(
      ticketId,
      `User ${reviewer} submitted a ${rating}-star review for Ticket #${ticket.globalId || ticketId}.`
    );

    res.status(201).json({
      success: true,
      reviewId,
      message: "Review submitted successfully. Please click 'Confirm Done' to complete the ticket."
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
};

exports.getReviewByTicketId = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const review = await reviewModel.getReviewByTicketId(ticketId);
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
};

exports.getPersonnelStats = async (req, res) => {
  try {
    const { assignedTo } = req.params;
    const stats = await reviewModel.getPersonnelStats(assignedTo);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching personnel stats:", error);
    res.status(500).json({ error: "Failed to fetch personnel stats" });
  }
};

exports.getDepartmentStats = async (req, res) => {
  try {
    const { department } = req.params;
    const stats = await reviewModel.getDepartmentStats(department);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({ error: "Failed to fetch department stats" });
  }
};

exports.getAllPersonnelStats = async (req, res) => {
  try {
    const stats = await reviewModel.getAllPersonnelStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching all personnel stats:", error);
    res.status(500).json({ error: "Failed to fetch all personnel stats" });
  }
};

exports.confirmDone = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { username } = req.body;

    // Check if ticket exists
    const ticket = await ticketModel.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check if ticket is in Resolved status
    const normalizedStatus = ticket.status ? ticket.status.trim().toLowerCase() : "";
    if (normalizedStatus !== "resolved") {
      return res.status(400).json({ error: "Ticket must be in Resolved status to confirm done" });
    }

    // Check if review exists for this ticket
    const existingReview = await reviewModel.getReviewByTicketId(ticketId);
    if (!existingReview) {
      return res.status(400).json({ error: "Please submit a review before confirming done" });
    }

    // Check if user is the ticket owner
    if (ticket.createdBy !== username) {
      return res.status(403).json({ error: "Only ticket owner can confirm done" });
    }

    // Update ticket status to Finished
    await ticketModel.updateTicketStatus(ticketId, "Finished");

    // Create activity log entry
    await ticketModel.createActivityLog(
      ticketId,
      `User ${username} confirmed completion of Ticket #${ticket.globalId || ticketId}. Ticket marked as Finished.`
    );

    res.status(200).json({
      success: true,
      message: "Ticket confirmed as Finished successfully."
    });
  } catch (error) {
    console.error("Error confirming done:", error);
    res.status(500).json({ error: "Failed to confirm done" });
  }
};
