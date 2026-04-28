-- TicketingSystem Database Schema
-- Run this in MySQL Workbench to create all tables

-- Create Database
CREATE DATABASE IF NOT EXISTS ticketingsystem;
USE ticketingsystem;

-- ============================================
-- ALTER EXISTING TABLES (For already created databases)
-- ============================================
-- Run these if your users table already exists:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_token VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS token_expires DATETIME DEFAULT NULL;

-- ============================================
-- 1. USERS TABLE
-- ============================================
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    dept VARCHAR(100) NOT NULL,
    login_count INT DEFAULT 0,
    auth_token VARCHAR(255) DEFAULT NULL,
    token_expires DATETIME DEFAULT NULL
);

-- ============================================
-- 2. TICKETS TABLE
-- ============================================
CREATE TABLE tickets (
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

-- ============================================
-- 3. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticketId VARCHAR(255) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    message TEXT,
    attachment TEXT,
    is_read INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
);

-- ============================================
-- 4. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
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
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert a sample department head
INSERT INTO users (id, username, password, role, dept, login_count, auth_token, token_expires) 
VALUES ('u_1234567890000', 'admin', 'admin123', 'Head', 'IT', 0, NULL, NULL);

-- Insert a sample regular user
INSERT INTO users (id, username, password, role, dept, login_count, auth_token, token_expires) 
VALUES ('u_1234567890001', 'user1', 'user123', 'User', 'IT', 0, NULL, NULL);

-- Insert a sample ticket
INSERT INTO tickets (id, title, description, category, status, createdBy, dept, date, createdAt, updatedAt)
VALUES ('t_1234567890000', 'Sample Ticket', 'This is a test ticket description', 'IT Support', 'PENDING', 'user1', 'IT', NOW(), NOW(), NOW());
