#!/usr/bin/env tsx
// Create Admin User Script
// Usage: npx tsx scripts/create-admin-user.ts

import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';
import readline from 'readline';

interface AdminUserData {
  email: string;
  password: string;
  name?: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function askPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let password = '';
    
    process.stdin.on('data', (ch) => {
      const char = ch.toString();
      
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        process.exit(1);
      } else if (char === '\u007f' || char === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

async function createAdminUser() {
  console.log('🔐 Admin User Creation Tool\n');

  try {
    // Get admin user details
    const email = await askQuestion('Enter admin email: ');
    const name = await askQuestion('Enter admin name (optional): ');
    const password = await askPassword('Enter admin password: ');
    const confirmPassword = await askPassword('Confirm admin password: ');

    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match!');
      process.exit(1);
    }

    if (password.length < 8) {
      console.log('\n❌ Password must be at least 8 characters long!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.isAdmin) {
        console.log(`\n⚠️  User ${email} already exists and is already an admin!`);
        process.exit(0);
      } else {
        // Make existing user admin
        const confirmed = await askQuestion(`\nUser ${email} exists. Make them admin? (y/N): `);
        if (confirmed.toLowerCase() === 'y' || confirmed.toLowerCase() === 'yes') {
          await prisma.user.update({
            where: { email },
            data: { isAdmin: true }
          });
          console.log(`\n✅ User ${email} is now an admin!`);
        } else {
          console.log('\n❌ Operation cancelled.');
        }
        process.exit(0);
      }
    }

    // Hash password if creating new user
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        isAdmin: true,
        balance: 0,
        emailVerified: new Date() // Mark as verified for admin
      }
    });

    console.log(`\n✅ Admin user created successfully!`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name || 'Not provided'}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Admin: ${adminUser.isAdmin}`);

    console.log(`\n🚀 You can now log in to the admin dashboard:`);
    console.log(`   1. Go to http://localhost:3000/auth/signin`);
    console.log(`   2. Sign in with email: ${email}`);
    console.log(`   3. Navigate to http://localhost:3000/admin/configurations`);

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Operation cancelled by user');
  rl.close();
  process.exit(1);
});

// Run the script
createAdminUser();