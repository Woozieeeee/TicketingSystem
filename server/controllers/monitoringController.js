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

    // Get real data from monitoring tables
    // Get active users in last 24 hours from activity_logs
    const [activeUsers24hData] = await db.query(`
      SELECT DISTINCT username
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    const activeUsers24h = activeUsers24hData.length;

    // Get failed login attempts in last 24 hours
    const [failedLogins24hData] = await db.query(`
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE success = FALSE AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    const failedLogins24h = failedLogins24hData[0]?.count || 0;

    // Get top resources accessed in last 24 hours from activity_logs
    const [topResources24hData] = await db.query(`
      SELECT 
        COALESCE(resource, 'UNKNOWN') as resource,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY resource
      ORDER BY count DESC
      LIMIT 10
    `);
    const topResources24h = topResources24hData;

    // Get recent security events from system_alerts
    const [recentSecurityEventsData] = await db.query(`
      SELECT 
        type,
        severity,
        message,
        details,
        username,
        resolved,
        created_at
      FROM system_alerts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `);
    const recentSecurityEvents = recentSecurityEventsData.map(alert => ({
      ...alert,
      details: alert.details ? JSON.parse(alert.details) : null
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

// Get activity logs with filtering and pagination
const getActivityLogs = async (req, res) => {
  try {
    const {
      username,
      action,
      limit = 50,
      offset = 0
    } = req.query;

    const db = require('../config/db');
    
    let query = `
      SELECT 
        id,
        username,
        action,
        resource,
        resource_id,
        details,
        ip_address,
        user_agent,
        role,
        created_at
      FROM activity_logs
    `;
    
    const params = [];
    const conditions = [];
    
    if (username) {
      conditions.push('username = ?');
      params.push(username);
    }
    
    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [activities] = await db.query(query, params);

    // Parse JSON details for each activity
    const parsedActivities = activities.map(activity => ({
      ...activity,
      details: activity.details ? JSON.parse(activity.details) : null
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [countResult] = await db.query(countQuery, params.slice(0, -2));

    res.json({
      success: true,
      data: parsedActivities,
      total: countResult[0].total,
      filters: { username, action, limit, offset }
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

// Get system alerts
const getSystemAlerts = async (req, res) => {
  try {
    const { 
      severity, 
      type, 
      resolved = 'false',
      limit = 20, 
      offset = 0 
    } = req.query;

    const db = require('../config/db');

    let query = `
      SELECT 
        id,
        type,
        severity,
        message,
        details,
        user_id,
        username,
        resolved,
        resolved_by,
        resolved_at,
        created_at
      FROM system_alerts
    `;
    
    const params = [];
    const conditions = [];
    
    if (severity) {
      conditions.push('severity = ?');
      params.push(severity);
    }
    
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    
    if (resolved === 'true') {
      conditions.push('resolved = TRUE');
    } else if (resolved === 'false') {
      conditions.push('resolved = FALSE');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [alerts] = await db.query(query, params);

    // Parse JSON details for each alert
    const parsedAlerts = alerts.map(alert => ({
      ...alert,
      details: alert.details ? JSON.parse(alert.details) : null
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM system_alerts';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [countResult] = await db.query(countQuery, params.slice(0, -2));

    res.json({
      success: true,
      data: parsedAlerts,
      total: countResult[0].total,
      filters: { severity, type, resolved, limit, offset }
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

// Create system alert
const createSystemAlert = async (req, res) => {
  try {
    const { type, severity, message, details, username } = req.body;
    
    if (!type || !severity || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, severity, message'
      });
    }

    const db = require('../config/db');
    
    const [result] = await db.query(`
      INSERT INTO system_alerts (type, severity, message, details, username, resolved)
      VALUES (?, ?, ?, ?, ?, FALSE)
    `, [
      type,
      severity,
      message,
      details ? JSON.stringify(details) : null,
      username || req.user?.username || 'system'
    ]);

    res.json({
      success: true,
      data: {
        id: result.insertId,
        type,
        severity,
        message,
        details,
        username: username || req.user?.username || 'system',
        resolved: false
      }
    });
  } catch (error) {
    console.error('❌ Create System Alert Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create system alert',
      message: error.message
    });
  }
};

// Resolve system alert
const resolveSystemAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolved_by } = req.body;
    
    if (!alertId) {
      return res.status(400).json({
        success: false,
        error: 'Missing alert ID'
      });
    }

    const db = require('../config/db');
    
    const [result] = await db.query(`
      UPDATE system_alerts
      SET resolved = TRUE, resolved_by = ?, resolved_at = NOW()
      WHERE id = ?
    `, [resolved_by || req.user?.username || 'system', alertId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: {
        id: alertId,
        resolved: true,
        resolved_by: resolved_by || req.user?.username || 'system',
        resolved_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Resolve System Alert Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve system alert',
      message: error.message
    });
  }
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

// Get performance metrics from system_metrics table
const getPerformanceMetrics = async (req, res) => {
  try {
    const { hours = 24, metric_name } = req.query;
    
    const db = require('../config/db');
    
    let query = `
      SELECT 
        id,
        metric_name,
        metric_value,
        metric_unit,
        tags,
        recorded_at
      FROM system_metrics
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    
    const params = [parseInt(hours)];
    
    if (metric_name) {
      query += ` AND metric_name = ?`;
      params.push(metric_name);
    }
    
    query += ` ORDER BY recorded_at DESC LIMIT 100`;
    
    const [metrics] = await db.query(query, params);
    
    // Parse JSON tags for each metric
    const parsedMetrics = metrics.map(metric => ({
      ...metric,
      tags: metric.tags ? JSON.parse(metric.tags) : null
    }));
    
    // Get aggregated statistics
    const [stats] = await db.query(`
      SELECT 
        metric_name,
        COUNT(*) as count,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value
      FROM system_metrics
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      GROUP BY metric_name
    `, [parseInt(hours)]);

    res.json({
      success: true,
      data: {
        metrics: parsedMetrics,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('❌ Get Performance Metrics Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics',
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
  getDepartmentPerformance,
  getPerformanceMetrics
};
