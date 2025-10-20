-- SQL to make an existing user an admin
UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@example.com';

-- Or create a new admin user directly (replace values)
INSERT INTO "User" (id, email, name, password, "isAdmin", balance, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'admin-user-id', 
  'admin@yourcompany.com',
  'Admin User',
  '$2a$12$hashedPasswordHere', -- Use bcrypt to hash your password
  true,
  1000.0,
  NOW(),
  NOW(),
  NOW()
);