const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    await p.$connect();
    const enums = await p.$queryRaw`
      SELECT t.oid, t.typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumtypid = t.oid)
    `;
    const names = enums.map(e => e.typname);
    const pairs = [];
    for (const n of names) {
      for (const m of names) {
        if (n !== m && n.toLowerCase() === m.toLowerCase()) {
          // pair of names differing only by case
          // ensure we only capture lowercase -> PascalCase (i.e., n is lowercase)
          if (n === n.toLowerCase()) {
            pairs.push({ lower: n, other: m });
          }
        }
      }
    }
    // Deduplicate pairs by lower
    const uniq = Object.values(pairs.reduce((acc, cur) => { acc[cur.lower] = cur; return acc; }, {}));
    console.log('Found enum pairs:', uniq);

    for (const { lower, other } of uniq) {
      // decide target: prefer the variant that starts with uppercase letter
      const target = other[0] === other[0].toUpperCase() ? other : (lower[0].toUpperCase()+lower.slice(1));
      console.log(`\nProcessing ${lower} -> ${target}`);

      const cols = await p.$queryRawUnsafe(
        `SELECT c.relname as table_name, a.attname as column_name, pg_get_expr(ad.adbin,c.oid) as default_expr
         FROM pg_attribute a
         JOIN pg_class c ON a.attrelid = c.oid
         JOIN pg_type t ON a.atttypid = t.oid
         LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
         WHERE a.attnum > 0 AND NOT a.attisdropped AND t.typname = $1`,
        lower
      );

      if (cols.length === 0) {
        console.log(` No columns use ${lower}`);
        continue;
      }

      for (const col of cols) {
        const table = col.table_name;
        const column = col.column_name;
        const defaultExpr = col.default_expr;
        console.log(` - ${table}.${column} default=${defaultExpr}`);

        if (defaultExpr) {
          console.log('   Dropping default');
          await p.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
        }

        console.log(`   Altering type to \"${target}\"`);
        await p.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE \"${target}\" USING "${column}"::text::\"${target}\";`);

        if (defaultExpr) {
          const m = defaultExpr.match(/'([^']+)'/);
          const label = m ? m[1] : null;
          if (label) {
            console.log(`   Restoring default '${label}'::\"${target}\"`);
            await p.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${label}'::\"${target}\";`);
          }
        }
        console.log('   Done');
      }
    }

    console.log('\nAll enum case fixes attempted.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await p.$disconnect();
  }
})();
