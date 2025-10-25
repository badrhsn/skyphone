const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Inspecting enum types...');

    const enumTypes = await prisma.$queryRaw`
      SELECT t.oid, t.typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumtypid = t.oid)
    `;

    const names = enumTypes.map(e => e.typname);
    const lowerCaseEnums = names.filter(n => n.toLowerCase() === n && names.includes(n[0].toUpperCase() + n.slice(1)));

    console.log('Found lowercase enums with PascalCase counterparts:', lowerCaseEnums);

    for (const lower of lowerCaseEnums) {
      const pascal = lower[0].toUpperCase() + lower.slice(1);
      console.log(`\nProcessing enum pair: ${lower} -> ${pascal}`);

      // Find columns using the lowercase enum type
      const cols = await prisma.$queryRawUnsafe(
        `SELECT c.relname as table_name, a.attname as column_name, pg_get_expr(ad.adbin,c.oid) as default_expr
         FROM pg_attribute a
         JOIN pg_class c ON a.attrelid = c.oid
         JOIN pg_type t ON a.atttypid = t.oid
         LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
         WHERE a.attnum > 0 AND NOT a.attisdropped AND t.typname = $1`,
        lower
      );

      if (cols.length === 0) {
        console.log(` No columns are using type ${lower}`);
        continue;
      }

      for (const col of cols) {
        const table = col.table_name;
        const column = col.column_name;
        const defaultExpr = col.default_expr; // e.g. 'PENDING'::paymentstatus
        console.log(` - Found column ${table}.${column} default=${defaultExpr}`);

        // If default exists, drop it
        if (defaultExpr) {
          console.log(`   Dropping default for ${table}.${column}`);
          await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
        }

        // Alter the column type to PascalCase using text cast
        console.log(`   Altering ${table}.${column} to type \"${pascal}\"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE \"${pascal}\" USING "${column}"::text::\"${pascal}\";`);

        // If default existed, restore it but cast to PascalCase type (extract label from defaultExpr)
        if (defaultExpr) {
          // Try to extract the string literal label
          const m = defaultExpr.match(/'([^']+)'/);
          const label = m ? m[1] : null;
          if (label) {
            console.log(`   Restoring default '${label}'::\"${pascal}\" for ${table}.${column}`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${label}'::\"${pascal}\";`);
          } else {
            console.log(`   Could not parse default expression: ${defaultExpr}. Skipping restore.`);
          }
        }

        console.log(`   Done with ${table}.${column}`);
      }
    }

    console.log('\nEnum case-fix complete.');
  } catch (err) {
    console.error('Error during enum fix:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
