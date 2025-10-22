-- Create Admin User SQL Script
-- This creates an admin user with email admin@yadaphone.com

-- First, check if the user already exists
-- If they exist, make them admin
UPDATE User 
SET isAdmin = 1 
WHERE email = 'admin@yadaphone.com';

-- If no rows were updated, insert a new admin user
-- Password is hashed version of 'admin123' (change this!)
INSERT OR IGNORE INTO User (
  id,
  email, 
  name, 
  password, 
  isAdmin, 
  balance, 
  emailVerified,
  createdAt,
  updatedAt
) VALUES (
  'admin_' || substr(hex(randomblob(8)), 1, 16),
  'admin@yadaphone.com',
  'Admin User',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJUPgFTSe', -- admin123
  1,
  0.0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

-- Verify the admin user was created
SELECT id, email, name, isAdmin, createdAt 
FROM User 
WHERE email = 'admin@yadaphone.com';