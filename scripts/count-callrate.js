const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    await p.$connect();
    const c = await p.callRate.count();
    console.log('callRate count in Supabase:', c);
  } catch (err) {
    console.error(err);
  } finally {
    await p.$disconnect();
  }
})();
