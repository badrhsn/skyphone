import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_API_KEY_SID',
      'TWILIO_API_KEY_SECRET'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Missing environment variables',
        missing: missingVars
      }, { status: 500 })
    }
    
    // Get system info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      timestamp: new Date().toISOString()
    }
    
    // Check provider availability
    const providers = {
      twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET)
    }
    
    return NextResponse.json({
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      providers,
      system: systemInfo,
      features: {
        callRecording: !!process.env.AWS_ACCESS_KEY_ID,
        multiProvider: false,
        enterpriseAPI: !!process.env.ENTERPRISE_API_KEY,
        payments: !!process.env.STRIPE_SECRET_KEY
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}