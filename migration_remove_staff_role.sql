-- Migration: Remove Staff role and convert existing Staff users to Admin
-- This script converts all users with 'Staff' role to 'Admin' role
-- Run this script to update your database after removing Staff from the codebase

-- Update all Staff users to Admin
UPDATE users 
SET role = 'Admin' 
WHERE role = 'Staff';

-- Verify the update
SELECT 
    role, 
    COUNT(*) as user_count 
FROM users 
GROUP BY role;

-- Expected result should show: Admin, Head, User (no Staff)
