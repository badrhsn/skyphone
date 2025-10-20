const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔧 Creating admin account...')
    
    // Get admin details from command line arguments or use defaults
    const args = process.argv.slice(2)
    const adminEmail = args[0] || process.env.ADMIN_EMAIL || 'admin@yadaphone.com'
    const adminPassword = args[1] || process.env.ADMIN_PASSWORD || 'admin123456'
    const adminName = args[2] || process.env.ADMIN_NAME || 'Admin User'
    
    console.log('📧 Email:', adminEmail)
    console.log('👤 Name:', adminName)
    
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingUser) {
      console.log('⚠️  User already exists. Making them admin...')
      
      const updatedAdmin = await prisma.user.update({
        where: { email: adminEmail },
        data: { 
          isAdmin: true,
          // Update password if provided
          ...(args[1] && { password: await bcrypt.hash(adminPassword, 12) })
        }
      })
      
      console.log('✅ Updated existing user to admin!')
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
        balance: 1000.0,
        emailVerified: new Date(),
      }
    })
    
    console.log('')
    console.log('🎉 Admin account created successfully!')
    console.log('═══════════════════════════════════')
    console.log('📧 Email:', adminUser.email)
    console.log('👤 Name:', adminUser.name)
    console.log('🔑 Password:', adminPassword)
    console.log('💰 Balance: $' + adminUser.balance.toFixed(2))
    console.log('🛡️  Admin: YES')
    console.log('═══════════════════════════════════')
    console.log('')
    console.log('⚠️  SECURITY REMINDER:')
    console.log('   Please change the admin password after first login!')
    console.log('')
    console.log('🌐 Access Points:')
    console.log('   • Login: /auth/signin')
    console.log('   • Admin Panel: /admin')  
    console.log('   • Analytics: /admin/analytics')
    
    return adminUser
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Show usage info
function showUsage() {
  console.log('')
  console.log('📖 Usage:')
  console.log('   node scripts/create-admin.js [email] [password] [name]')
  console.log('')
  console.log('📝 Examples:')
  console.log('   node scripts/create-admin.js')
  console.log('   node scripts/create-admin.js admin@mycompany.com')
  console.log('   node scripts/create-admin.js admin@mycompany.com mySecurePass123')
  console.log('   node scripts/create-admin.js admin@mycompany.com mySecurePass123 "John Admin"')
  console.log('')
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage()
  process.exit(0)
}

// Run the script
createAdmin()
  .then(() => {
    console.log('✅ Admin creation completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Admin creation failed:', error)
    console.log('')
    showUsage()
    process.exit(1)
  })