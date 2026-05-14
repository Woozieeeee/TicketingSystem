-- Migration: Add createdAt column to users table
-- Run this in MySQL Workbench to fix the monitoring API error

USE ticketingsystem;

-- Add createdAt column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have createdAt set to current time
UPDATE users 
SET createdAt = NOW() 
WHERE createdAt IS NULL;

SELECT 'Migration completed successfully' as status;
