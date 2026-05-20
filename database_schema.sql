-- TicketingSystem Complete Database Schema
-- Includes both main application tables and monitoring tables
-- Safe to run on existing databases - preserves existing data

-- Create Database
CREATE DATABASE IF NOT EXISTS ticketingsystem;
USE ticketingsystem;

-- ============================================
-- DROP ONLY MONITORING TABLES (safe for existing data)
-- ============================================
DROP TABLE IF EXISTS system_metrics;
DROP TABLE IF EXISTS resource_access_log;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS system_alerts;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS activity_logs;

-- ============================================
-- MAIN APPLICATION TABLES (preserved if exist)
-- ============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    dept VARCHAR(100) NOT NULL,
    login_count INT DEFAULT 0,
    auth_token VARCHAR(255) DEFAULT NULL,
    token_expires DATETIME DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    createdBy VARCHAR(255) NOT NULL,
    dept VARCHAR(100) NOT NULL,
    date DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reminder_flag INT DEFAULT 0,
    last_reminded_at DATETIME,
    userMarkedDone INT DEFAULT 0,
    headMarkedDone INT DEFAULT 0
);

-- 3. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticketId VARCHAR(255) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    message TEXT,
    attachment TEXT,
    is_read INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ticketGlobalId VARCHAR(255),
    type VARCHAR(50) DEFAULT 'default',
    is_read INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- MONITORING TABLES
-- ============================================

-- 5. ACTIVITY LOGS TABLE
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

-- 6. USER SESSIONS TABLE
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

-- 7. SYSTEM ALERTS TABLE
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

-- 8. LOGIN ATTEMPTS TABLE
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

-- 9. RESOURCE ACCESS LOG TABLE
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

-- 10. SYSTEM METRICS TABLE
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
('admin', 'LOGIN_SUCCESS', 'AUTH', '{"success": true}', '127.0.0.1', 'Head'),
('user1', 'LOGIN_SUCCESS', 'AUTH', '{"success": true}', '127.0.0.1', 'User'),
('admin', 'USER_CREATED', 'USER', '{"userId": "u_1234567890001"}', '127.0.0.1', 'Head');

-- Insert sample system alerts
INSERT INTO system_alerts (type, severity, message, details, username) VALUES
('SECURITY_EVENT', 'MEDIUM', 'Multiple failed login attempts detected', '{"attempts": 3, "username": "unknown"}', 'system'),
('SYSTEM_EVENT', 'LOW', 'Database backup completed successfully', '{"backupSize": "250MB"}', 'system');

-- Insert sample login attempts
INSERT INTO login_attempts (username, success, ip_address, failure_reason) VALUES
('admin', TRUE, '127.0.0.1', NULL),
('unknown', FALSE, '192.168.1.100', 'Invalid credentials'),
('unknown', FALSE, '192.168.1.100', 'Invalid credentials');

-- ============================================
-- SAFE COLUMN ADDITIONS (for existing databases)
-- Uses procedures to avoid errors if columns already exist
-- ============================================

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS add_column_if_missing()
BEGIN
    -- Add createdAt to users if missing
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'createdAt'
    ) THEN
        ALTER TABLE users ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add status to users if missing
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'Active';
    END IF;

    -- Add password_change_required to users if missing
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_change_required'
    ) THEN
        ALTER TABLE users ADD COLUMN password_change_required TINYINT(1) DEFAULT 1;
    END IF;

    -- Set createdAt for existing records that don't have it
    UPDATE users SET createdAt = NOW() WHERE createdAt IS NULL;
END //
DELIMITER ;

CALL add_column_if_missing();
DROP PROCEDURE IF EXISTS add_column_if_missing;

SELECT 'Migration completed successfully' AS status;
