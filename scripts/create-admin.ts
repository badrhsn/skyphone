import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔧 Creating admin account...')
    
    // Get admin details from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yadaphone.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456' // Change this!
    const adminName = process.env.ADMIN_NAME || 'Admin User'
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', adminEmail)
      
      // Update existing user to be admin
      const updatedAdmin = await prisma.user.update({
        where: { email: adminEmail },
        data: { isAdmin: true }
      })
      
      console.log('✅ Updated existing user to admin:', updatedAdmin.email)
      return updatedAdmin
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    // Create new admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        isAdmin: true,
        balance: 1000.0, // Give admin some initial balance
        emailVerified: new Date(), // Auto-verify admin email
      }
    })
    
    console.log('🎉 Admin account created successfully!')
    console.log('📧 Email:', adminUser.email)
    console.log('👤 Name:', adminUser.name)
    console.log('🔑 Password:', adminPassword)
    console.log('💰 Balance: $' + adminUser.balance)
    console.log('')
    console.log('⚠️  IMPORTANT: Please change the admin password after first login!')
    console.log('📍 Access admin panel at: /admin')
    
    return adminUser
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('✅ Admin creation completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Admin creation failed:', error)
      process.exit(1)
    })
}

export { createAdmin }