const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function debugAuth() {
  try {
    console.log('🔍 Debugging authentication...')
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'admin@yadaphone.com' }
    })
    
    if (!user) {
      console.log('❌ User does not exist!')
      return
    }
    
    console.log('✅ User found:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Has Password:', !!user.password)
    console.log('   Password Length:', user.password ? user.password.length : 0)
    console.log('   Is Admin:', user.isAdmin)
    console.log('   Balance:', user.balance)
    
    // Test password comparison
    const testPassword = 'HASSOUNI1az@'
    console.log('\n🔐 Testing password...')
    console.log('   Test Password:', testPassword)
    
    if (user.password) {
      const isValid = await bcrypt.compare(testPassword, user.password)
      console.log('   Password Valid:', isValid)
      
      if (!isValid) {
        console.log('❌ Password mismatch! Let me create a fresh hash...')
        const newHash = await bcrypt.hash(testPassword, 12)
        
        await prisma.user.update({
          where: { email: 'admin@yadaphone.com' },
          data: { password: newHash }
        })
        
        console.log('✅ Password updated successfully!')
      }
    } else {
      console.log('❌ No password set for user!')
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAuth()