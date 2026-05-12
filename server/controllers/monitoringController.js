const { logSecurityEvent } = require('../middleware/monitoring');

// Get monitoring statistics and analytics
const getMonitoringStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get database connection
    const db = require('../config/db');
    
    console.log('📊 Fetching monitoring stats...');
    
    // Get all users with their login counts
    const [allUsers] = await db.query(`
      SELECT username, role, login_count, createdAt, dept 
      FROM users 
      ORDER BY login_count DESC, createdAt DESC
    `);
    
    console.log('👥 Users found:', allUsers.length);

    // Get real ticket statistics
    const [ticketStats] = await db.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as ongoing_tickets,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'FINISHED' THEN 1 END) as finished_tickets,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as tickets_today,
        COUNT(CASE WHEN reminder_flag = 1 THEN 1 END) as pending_reminders
      FROM tickets
    `);
    
    console.log('🎫 Ticket stats:', ticketStats[0]);

    // Get user ticket statistics
    const [userTicketStats] = await db.query(`
      SELECT 
        u.username,
        u.role,
        u.dept,
        u.login_count,
        u.createdAt as account_created,
        COUNT(t.id) as total_tickets_created,
        COUNT(CASE WHEN t.status = 'PENDING' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as ongoing_tickets,
        COUNT(CASE WHEN t.status = 'RESOLVED' THEN 1 END) as resolved_tickets,
        MAX(t.createdAt) as last_ticket_created
      FROM users u
      LEFT JOIN tickets t ON u.username = t.createdBy
      GROUP BY u.id, u.username, u.role, u.dept, u.login_count, u.createdAt
      ORDER BY total_tickets_created DESC, u.login_count DESC
      LIMIT 20
    `);
    
    console.log('👤 User ticket stats:', userTicketStats.length, 'users');

    // Get recent tickets
    const [recentTickets] = await db.query(`
      SELECT 
        t.id,
        t.title,
        t.status,
        t.createdBy,
        t.dept,
        t.createdAt,
        u.role as user_role
      FROM tickets t
      JOIN users u ON t.createdBy = u.username
      ORDER BY t.createdAt DESC
      LIMIT 10
    `);
    
    console.log('📝 Recent tickets:', recentTickets.length);

    // Get department statistics
    const [deptTicketStats] = await db.query(`
      SELECT 
        dept,
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as ongoing_tickets,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_tickets
      FROM tickets
      GROUP BY dept
      ORDER BY total_tickets DESC
    `);
    
    console.log('🏢 Department stats:', deptTicketStats.length, 'departments');

    // Create mock data for missing monitoring tables
    const activeUsers24h = allUsers.filter(user => {
      const userCreatedDate = new Date(user.createdAt);
      const now = new Date();
      const hoursDiff = (now - userCreatedDate) / (1000 * 60 * 60);
      return hoursDiff <= 24 || user.login_count > 0;
    });

    const topResources24h = [
      { resource: 'TICKETS', count: ticketStats[0]?.total_tickets || 0 },
      { resource: 'USERS', count: allUsers.length },
      { resource: 'LOGIN', count: allUsers.reduce((sum, user) => sum + user.login_count, 0) }
    ];

    const recentSecurityEvents = allUsers
      .filter(user => user.login_count > 5)
      .slice(0, 5)
      .map(user => ({
        type: 'LOGIN_ACTIVITY',
        severity: user.login_count > 10 ? 'HIGH' : 'MEDIUM',
        message: `User ${user.username} has ${user.login_count} logins`,
        details: { username: user.username, loginCount: user.login_count, role: user.role },
        username: user.username,
        resolved: false,
        created_at: user.createdAt
      }));

    res.json({
      success: true,
      data: {
        total: allUsers.length,
        byRole: [
          { role: 'Admin', count: allUsers.filter(u => u.role === 'Admin').length },
          { role: 'Staff', count: allUsers.filter(u => u.role === 'Staff').length },
          { role: 'User', count: allUsers.filter(u => u.role === 'User').length }
        ],
        byAction: [
          { action: 'LOGIN', count: allUsers.reduce((sum, user) => sum + user.login_count, 0) },
          { action: 'TICKET_CREATED', count: ticketStats[0]?.total_tickets || 0 }
        ],
        recent24h: activeUsers24h.length,
        failedLogins24h: 0,
        activeUsers24h,
        topResources24h,
        recentSecurityEvents,
        ticketStats: ticketStats[0],
        userTicketStats,
        deptTicketStats,
        recentTickets
      }
    });
  } catch (error) {
    console.error('❌ Get Monitoring Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring statistics',
      message: error.message
    });
  }
};

// Get activity logs with filtering and pagination (using tickets as activity logs)
const getActivityLogs = async (req, res) => {
  try {
    const {
      username,
      limit = 50,
      offset = 0
    } = req.query;

    const db = require('../config/db');
    
    // Use ticket creation as activity logs since activity_logs table doesn't exist yet
    let query = `
      SELECT 
        t.id,
        t.createdBy as username,
        'TICKET_CREATED' as action,
        'TICKET' as resource,
        t.id as resource_id,
        JSON_OBJECT('title', t.title, 'category', t.category, 'status', t.status) as details,
        u.role,
        t.createdAt as created_at
      FROM tickets t
      JOIN users u ON t.createdBy = u.username
    `;
    
    const params = [];
    
    if (username) {
      query += ` WHERE t.createdBy = ?`;
      params.push(username);
    }
    
    query += ` ORDER BY t.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [activities] = await db.query(query, params);

    res.json({
      success: true,
      data: activities,
      total: activities.length,
      filters: { username, limit, offset }
    });
  } catch (error) {
    console.error('❌ Get Activity Logs Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs',
      message: error.message
    });
  }
};

// Get user ticket statistics
const getUserTicketStats = async (req, res) => {
  try {
    const { username } = req.query;
    
    const db = require('../config/db');
    
    let query = `
      SELECT 
        u.username,
        u.role,
        u.dept,
        u.login_count,
        COUNT(t.id) as total_tickets_created,
        COUNT(CASE WHEN t.status = 'PENDING' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as ongoing_tickets,
        COUNT(CASE WHEN t.status = 'RESOLVED' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN t.status = 'FINISHED' THEN 1 END) as finished_tickets,
        MAX(t.createdAt) as last_ticket_created,
        u.createdAt as account_created
      FROM users u
      LEFT JOIN tickets t ON u.username = t.createdBy
    `;
    
    const params = [];
    
    if (username) {
      query += ` WHERE u.username = ?`;
      params.push(username);
    }
    
    query += ` GROUP BY u.id, u.username, u.role, u.dept, u.login_count, u.createdAt
      ORDER BY total_tickets_created DESC`;

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ Get User Ticket Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user ticket statistics',
      message: error.message
    });
  }
};

// Get ticket trends over time
const getTicketTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const db = require('../config/db');
    
    const [trends] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as ongoing_tickets,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'FINISHED' THEN 1 END) as finished_tickets
      FROM tickets 
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, [parseInt(days)]);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('❌ Get Ticket Trends Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket trends',
      message: error.message
    });
  }
};

// Get system alerts (using user login activity as alerts since system_alerts doesn't exist yet)
const getSystemAlerts = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const db = require('../config/db');

    // Use user login activity as system alerts
    const [alerts] = await db.query(`
      SELECT 
        id,
        'LOGIN_ACTIVITY' as type,
        CASE WHEN login_count > 10 THEN 'HIGH' 
             WHEN login_count > 5 THEN 'MEDIUM' 
             ELSE 'LOW' END as severity,
        CONCAT('User ', username, ' has ', login_count, ' total logins') as message,
        JSON_OBJECT('username', username, 'loginCount', login_count, 'role', role) as details,
        username,
        FALSE as resolved,
        createdAt as created_at
      FROM users 
      WHERE login_count > 0
      ORDER BY login_count DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('❌ Get System Alerts Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system alerts',
      message: error.message
    });
  }
};

// Create system alert (placeholder - not implemented yet)
const createSystemAlert = async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Alert creation not implemented yet'
  });
};

// Resolve system alert (placeholder - not implemented yet)
const resolveSystemAlert = async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Alert resolution not implemented yet'
  });
};

// Get department performance
const getDepartmentPerformance = async (req, res) => {
  try {
    const db = require('../config/db');
    
    const [deptPerformance] = await db.query(`
      SELECT 
        t.dept,
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN t.status = 'PENDING' THEN 1 END) as pending_tickets,
        COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as ongoing_tickets,
        COUNT(CASE WHEN t.status = 'RESOLVED' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN t.status = 'FINISHED' THEN 1 END) as finished_tickets,
        AVG(CASE WHEN t.status IN ('RESOLVED', 'FINISHED') 
            THEN TIMESTAMPDIFF(HOUR, t.createdAt, t.updatedAt) 
            ELSE NULL END) as avg_resolution_time_hours,
        COUNT(DISTINCT t.createdBy) as unique_users
      FROM tickets t
      GROUP BY t.dept
      ORDER BY total_tickets DESC
    `);

    res.json({
      success: true,
      data: deptPerformance
    });
  } catch (error) {
    console.error('❌ Get Department Performance Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department performance',
      message: error.message
    });
  }
};

module.exports = {
  getMonitoringStats,
  getActivityLogs,
  getUserTicketStats,
  getTicketTrends,
  getSystemAlerts,
  createSystemAlert,
  resolveSystemAlert,
  getDepartmentPerformance
};
