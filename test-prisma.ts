import { prisma } from '@/lib/db';

async function testPrismaModels() {
  console.log('Available models:', Object.keys(prisma));
  
  // Test CallerID model
  try {
    const count = await prisma.callerID.count();
    console.log('CallerID model works, count:', count);
  } catch (error) {
    console.log('CallerID error:', error);
    
    // Try lowercase
    try {
      const count2 = await (prisma as any).callerId.count();
      console.log('callerId model works, count:', count2);
    } catch (error2) {
      console.log('callerId error:', error2);
    }
  }
}

testPrismaModels();