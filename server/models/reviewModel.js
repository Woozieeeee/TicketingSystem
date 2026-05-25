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

exports.getAllReviews = async (filters = {}) => {
  try {
    let query = `
      SELECT 
        tr.id,
        tr.ticket_id,
        tr.reviewer,
        tr.reviewer_role,
        tr.assigned_to,
        tr.department,
        tr.rating,
        tr.comment,
        tr.created_at,
        t.title as ticket_title,
        t.category as ticket_category,
        t.status as ticket_status,
        t.globalId as ticket_global_id
      FROM ticket_reviews tr
      LEFT JOIN tickets t ON tr.ticket_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.rating) {
      query += ` AND tr.rating = ?`;
      params.push(filters.rating);
    }

    if (filters.department) {
      query += ` AND tr.department = ?`;
      params.push(filters.department);
    }

    if (filters.assigned_to) {
      query += ` AND tr.assigned_to = ?`;
      params.push(filters.assigned_to);
    }

    if (filters.startDate) {
      query += ` AND tr.created_at >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND tr.created_at <= ?`;
      params.push(filters.endDate);
    }

    if (filters.search) {
      query += ` AND (tr.comment LIKE ? OR tr.reviewer LIKE ? OR t.title LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY tr.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET ?`;
      params.push(filters.offset);
    }

    const [rows] = await db.query(query, params);
    return rows;
  } catch (error) {
    console.error("DB Error fetching all reviews:", error);
    throw error;
  }
};

exports.getReviewsAnalytics = async () => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_reviews,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star_reviews,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star_reviews,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star_reviews,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star_reviews,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star_reviews
      FROM ticket_reviews
    `);
    return rows[0] || { 
      total_reviews: 0, 
      average_rating: 0, 
      positive_reviews: 0, 
      negative_reviews: 0,
      five_star_reviews: 0,
      four_star_reviews: 0,
      three_star_reviews: 0,
      two_star_reviews: 0,
      one_star_reviews: 0
    };
  } catch (error) {
    console.error("DB Error fetching reviews analytics:", error);
    throw error;
  }
};
