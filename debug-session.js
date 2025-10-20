const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugSession() {
  try {
    console.log('Checking admin user...');
    
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@yadaphone.com' },
      select: { id: true, email: true, name: true, isAdmin: true, balance: true }
    });
    
    console.log('Admin user from DB:', JSON.stringify(adminUser, null, 2));
    
    // Test what authorize function would return
    if (adminUser) {
      const authResult = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        balance: adminUser.balance,
        isAdmin: adminUser.isAdmin,
      };
      console.log('What authorize() would return:', JSON.stringify(authResult, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSession();
