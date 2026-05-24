const db = require("../config/db");

exports.createReview = async (reviewData) => {
  try {
    const { ticket_id, reviewer, reviewer_role, assigned_to, department, rating, comment } = reviewData;
    
    if (!ticket_id || !reviewer || !reviewer_role || !assigned_to || !department || !rating) {
      console.error("❌ Cannot save review: Missing required fields");
      return null;
    }

    if (rating < 1 || rating > 5) {
      console.error("❌ Cannot save review: Rating must be between 1 and 5");
      return null;
    }

    const [result] = await db.query(
      `INSERT INTO ticket_reviews (ticket_id, reviewer, reviewer_role, assigned_to, department, rating, comment, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [ticket_id, reviewer, reviewer_role, assigned_to, department, rating, comment || null]
    );

    return result.insertId;
  } catch (error) {
    console.error("DB Error saving review:", error.message);
    throw error;
  }
};

exports.getReviewByTicketId = async (ticketId) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ticket_reviews WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1",
      [ticketId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("DB Error fetching review by ticket ID:", error);
    throw error;
  }
};

exports.getReviewsByAssignedTo = async (assignedTo) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ticket_reviews WHERE assigned_to = ? ORDER BY created_at DESC",
      [assignedTo]
    );
    return rows;
  } catch (error) {
    console.error("DB Error fetching reviews by assigned staff:", error);
    throw error;
  }
};

exports.getReviewsByDepartment = async (department) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ticket_reviews WHERE department = ? ORDER BY created_at DESC",
      [department]
    );
    return rows;
  } catch (error) {
    console.error("DB Error fetching reviews by department:", error);
    throw error;
  }
};

exports.getPersonnelStats = async (assignedTo) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_reviews,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_reviews
       FROM ticket_reviews 
       WHERE assigned_to = ?`,
      [assignedTo]
    );
    return rows[0] || { total_reviews: 0, avg_rating: 0, positive_reviews: 0, negative_reviews: 0 };
  } catch (error) {
    console.error("DB Error fetching personnel stats:", error);
    throw error;
  }
};

exports.getDepartmentStats = async (department) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_reviews,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_reviews
       FROM ticket_reviews 
       WHERE department = ?`,
      [department]
    );
    return rows[0] || { total_reviews: 0, avg_rating: 0, positive_reviews: 0, negative_reviews: 0 };
  } catch (error) {
    console.error("DB Error fetching department stats:", error);
    throw error;
  }
};

exports.getAllPersonnelStats = async () => {
  try {
    const [rows] = await db.query(
      `SELECT 
        assigned_to,
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_reviews,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_reviews
       FROM ticket_reviews 
       GROUP BY assigned_to
       ORDER BY avg_rating DESC`
    );
    return rows;
  } catch (error) {
    console.error("DB Error fetching all personnel stats:", error);
    throw error;
  }
};
