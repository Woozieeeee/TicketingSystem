-- Monitoring System Database Schema
-- Run this in MySQL Workbench to create monitoring tables

USE ticketingsystem;

-- ============================================
-- MONITORING TABLES
-- ============================================

-- 1. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  username VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(255),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  role VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_user_action (username, action)
);

-- 2. USER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_session_token (session_token),
  INDEX idx_expires_at (expires_at)
);

-- 3. SYSTEM ALERTS TABLE
CREATE TABLE IF NOT EXISTS system_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
  message TEXT NOT NULL,
  details JSON,
  user_id VARCHAR(255),
  username VARCHAR(255),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by VARCHAR(255),
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_severity (severity),
  INDEX idx_resolved (resolved),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
);

-- 4. LOGIN ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  failure_reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_success (success),
  INDEX idx_created_at (created_at),
  INDEX idx_ip_address (ip_address)
);

-- 5. RESOURCE ACCESS LOG TABLE
CREATE TABLE IF NOT EXISTS resource_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  username VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  access_level ENUM('READ', 'WRITE', 'DELETE', 'ADMIN') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_resource_type (resource_type),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- 6. SYSTEM METRICS TABLE
CREATE TABLE IF NOT EXISTS system_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4),
  metric_unit VARCHAR(50),
  tags JSON,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metric_name (metric_name),
  INDEX idx_recorded_at (recorded_at)
);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample activity logs
INSERT INTO activity_logs (username, action, resource, details, ip_address, role) VALUES
('admin', 'LOGIN_SUCCESS', 'AUTH', '{"success": true}', '127.0.0.1', 'Admin'),
('user1', 'LOGIN_SUCCESS', 'AUTH', '{"success": true}', '127.0.0.1', 'User'),
('admin', 'USER_CREATED', 'USER', '{"userId": "u_123"}', '127.0.0.1', 'Admin');

-- Insert sample system alerts
INSERT INTO system_alerts (type, severity, message, details, username) VALUES
('SECURITY_EVENT', 'MEDIUM', 'Multiple failed login attempts detected', '{"attempts": 3, "username": "unknown"}', 'system'),
('SYSTEM_EVENT', 'LOW', 'Database backup completed successfully', '{"backupSize": "250MB"}', 'system');

-- Insert sample login attempts
INSERT INTO login_attempts (username, success, ip_address, failure_reason) VALUES
('admin', TRUE, '127.0.0.1', NULL),
('unknown', FALSE, '192.168.1.100', 'Invalid credentials'),
('unknown', FALSE, '192.168.1.100', 'Invalid credentials');
