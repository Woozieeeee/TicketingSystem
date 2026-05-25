const reviewModel = require("../models/reviewModel");
const ticketModel = require("../models/ticketModel");

// DISABLED: Review submission temporarily disabled
exports.submitReview = async (req, res) => {
  return res.status(503).json({ error: "Review feature temporarily disabled" });
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

// DISABLED: Review confirm done temporarily disabled
exports.confirmDone = async (req, res) => {
  return res.status(503).json({ error: "Review feature temporarily disabled" });
};

// DISABLED: Get all reviews temporarily disabled
exports.getAllReviews = async (req, res) => {
  return res.status(503).json({ error: "Review feature temporarily disabled" });
};

// DISABLED: Get reviews analytics temporarily disabled
exports.getReviewsAnalytics = async (req, res) => {
  return res.status(503).json({ error: "Review feature temporarily disabled" });
};
