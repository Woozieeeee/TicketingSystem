// server/routes/monitoring.js

const express = require('express');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');
const { 
  logActivity, 
  detectSuspiciousActivity,
  logPerformance 
} = require('../middleware/monitoring');

const router = express.Router();
const monitoringController = require('../controllers/monitoringController');

// Apply monitoring middleware to all routes
router.use(logActivity('MONITORING_ACCESS', 'MONITORING'));
router.use(logPerformance);

// Get monitoring statistics and analytics
router.get('/stats', authenticateToken, requireAdminOrStaff, monitoringController.getMonitoringStats);

// Get activity logs with filtering
router.get('/activities', authenticateToken, requireAdminOrStaff, monitoringController.getActivityLogs);

// Get user ticket statistics
router.get('/user-tickets', authenticateToken, requireAdminOrStaff, monitoringController.getUserTicketStats);

// Get ticket trends over time
router.get('/ticket-trends', authenticateToken, requireAdminOrStaff, monitoringController.getTicketTrends);

// Get department performance
router.get('/department-performance', authenticateToken, requireAdminOrStaff, monitoringController.getDepartmentPerformance);

// Get performance metrics
router.get('/performance', authenticateToken, requireAdminOrStaff, monitoringController.getPerformanceMetrics);

// Get system alerts
router.get('/alerts', authenticateToken, requireAdminOrStaff, monitoringController.getSystemAlerts);

// Create system alert
router.post('/alerts', authenticateToken, requireAdminOrStaff, monitoringController.createSystemAlert);

// Resolve system alert
router.patch('/alerts/:alertId/resolve', authenticateToken, requireAdminOrStaff, monitoringController.resolveSystemAlert);

// Health check for monitoring system
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'monitoring'
  });
});

module.exports = router;
