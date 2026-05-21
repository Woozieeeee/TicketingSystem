// server/routes/monitoring.js

const express = require('express');
const { authenticateToken, requireAdminOrHead } = require('../middleware/auth');
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
router.get('/stats', authenticateToken, requireAdminOrHead, monitoringController.getMonitoringStats);

// Get activity logs with filtering
router.get('/activities', authenticateToken, requireAdminOrHead, monitoringController.getActivityLogs);

// Get user ticket statistics
router.get('/user-tickets', authenticateToken, requireAdminOrHead, monitoringController.getUserTicketStats);

// Get ticket trends over time
router.get('/ticket-trends', authenticateToken, requireAdminOrHead, monitoringController.getTicketTrends);

// Get department performance
router.get('/department-performance', authenticateToken, requireAdminOrHead, monitoringController.getDepartmentPerformance);

// Get performance metrics
router.get('/performance', authenticateToken, requireAdminOrHead, monitoringController.getPerformanceMetrics);

// Get system alerts
router.get('/alerts', authenticateToken, requireAdminOrHead, monitoringController.getSystemAlerts);

// Create system alert
router.post('/alerts', authenticateToken, requireAdminOrHead, monitoringController.createSystemAlert);

// Resolve system alert
router.patch('/alerts/:alertId/resolve', authenticateToken, requireAdminOrHead, monitoringController.resolveSystemAlert);

// Health check for monitoring system
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'monitoring'
  });
});

module.exports = router;