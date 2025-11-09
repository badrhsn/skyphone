import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkApiConfigurations() {
  console.log('🔍 Checking API configurations in database...\n')

  try {
    // Get all API configurations
    const configs = await prisma.apiConfiguration.findMany({
      select: {
        id: true,
        provider: true,
        isActive: true,
        environment: true,
        version: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        lastUsed: true,
      },
      orderBy: {
        provider: 'asc'
      }
    })

    if (configs.length === 0) {
      console.log('❌ No API configurations found in database!')
      console.log('\nThis is likely why calls are failing. You need to add Twilio configuration.')
      console.log('\nTo add Twilio config, you can:')
      console.log('1. Use the admin panel to add configuration')
      console.log('2. Or create a script to add the configuration programmatically')
      return
    }

    console.log('📋 Found API Configurations:')
    console.log('┌─────────────────┬────────┬─────────────┬─────────────────────┐')
    console.log('│ Provider        │ Active │ Environment │ Last Updated        │')
    console.log('├─────────────────┼────────┼─────────────┼─────────────────────┤')
    
    configs.forEach(config => {
      const provider = config.provider.padEnd(15)
      const active = (config.isActive ? 'Yes' : 'No').padEnd(6)
      const env = config.environment.padEnd(11)
      const updated = config.updatedAt.toISOString().substring(0, 19).replace('T', ' ')
      console.log(`│ ${provider} │ ${active} │ ${env} │ ${updated} │`)
    })
    
    console.log('└─────────────────┴────────┴─────────────┴─────────────────────┘')

    // Check specifically for Twilio
    const twilioConfig = configs.find(c => c.provider.toUpperCase() === 'TWILIO')
    
    if (twilioConfig) {
      console.log('\n✅ Twilio configuration found!')
      console.log(`   - Status: ${twilioConfig.isActive ? 'Active' : 'Inactive'}`)
      console.log(`   - Environment: ${twilioConfig.environment}`)
      console.log(`   - Version: ${twilioConfig.version}`)
      console.log(`   - Last Updated: ${twilioConfig.updatedAt.toISOString()}`)
      
      if (!twilioConfig.isActive) {
        console.log('\n⚠️  WARNING: Twilio configuration is INACTIVE!')
        console.log('   This could be why calls are failing.')
      }

      if (twilioConfig.lastUsed) {
        console.log(`   - Last Used: ${twilioConfig.lastUsed.toISOString()}`)
      } else {
        console.log('   - Last Used: Never')
      }
    } else {
      console.log('\n❌ No Twilio configuration found!')
      console.log('   This is why calls are failing.')
    }

    // Check configuration audit logs
    console.log('\n🔍 Recent configuration activity:')
    const auditLogs = await prisma.configurationAudit.findMany({
      select: {
        id: true,
        configurationId: true,
        action: true,
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    if (auditLogs.length > 0) {
      console.log('┌─────────────────┬────────────┬─────────────────────┐')
      console.log('│ Provider        │ Action     │ Date                │')
      console.log('├─────────────────┼────────────┼─────────────────────┤')
      
      auditLogs.forEach(log => {
        const provider = log.configurationId.padEnd(15)
        const action = log.action.padEnd(10)
        const date = log.createdAt.toISOString().substring(0, 19).replace('T', ' ')
        console.log(`│ ${provider} │ ${action} │ ${date} │`)
      })
      
      console.log('└─────────────────┴────────────┴─────────────────────┘')
    } else {
      console.log('   No configuration activity found.')
    }

  } catch (error) {
    console.error('❌ Error checking configurations:', error)
    
    if (error instanceof Error && error.message.includes('connect')) {
      console.log('\n💡 Database connection issue detected.')
      console.log('   Make sure your Supabase database is accessible and DATABASE_URL is correct.')
    }
  }
}

console.log('API Configuration Checker')
console.log('========================')
console.log('')

checkApiConfigurations()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })