const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function parseCsv(csvText) {
  // simple RFC4180 parser used earlier
  const rows = [];
  let i = 0;
  const len = csvText.length;
  let row = [];
  let field = '';
  let inQuotes = false;

  while (i < len) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') { // escaped quote
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ',') {
        row.push(field);
        field = '';
        i++;
        continue;
      }
      if (ch === '\n' || ch === '\r') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        if (ch === '\r' && csvText[i + 1] === '\n') i += 2; else i++;
        continue;
      }
      field += ch;
      i++;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toPrismaModelName(tableName) {
  // Prisma client uses camelCase property names for models: CallRate -> callRate
  return tableName[0].toLowerCase() + tableName.slice(1);
}

function coerceValue(key, val) {
  if (val === '') return null;
  // Dates first (many values are millisecond timestamps stored as integers)
  // NOTE: exclude 'version' from date parsing — some schemas store version as string/number that should be preserved
  if (/At$/.test(key) || /createdAt|updatedAt|lastChecked/i.test(key)) {
    const n = Number(val);
    if (!Number.isNaN(n) && val.trim() !== '') return new Date(n);
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }

  // phone-like fields should be strings in Prisma schema (fromNumber, toNumber, phoneNumber, etc.)
  if (/number$/i.test(key) || /phone/i.test(key)) {
    return String(val);
  }

  // avgResponseTime in source can be boolean (false) or a number. Map false/true -> null and numeric -> number
  if (key === 'avgResponseTime' || key === 'avg_response_time') {
    // ProviderStatus.avgResponseTime is non-nullable Int in schema — map falsy booleans to 0
    if (val === 'false' || val === 'FALSE' || val === '0' || val === '') return 0;
    if (val === 'true' || val === 'TRUE' || val === '1') return 0;
    if (!Number.isNaN(Number(val)) && val.trim() !== '') return Number(val);
    return 0;
  }

  // booleans (common field names)
  if (['isActive', 'is_active', 'isactive', 'active'].includes(key)) {
    if (val === '1' || val === 'true' || val === 'TRUE' || val === 't') return true;
    if (val === '0' || val === 'false' || val === 'FALSE' || val === 'f') return false;
  }

  // version should usually be a string in Prisma schema
  if (key === 'version') return String(val);

  // numbers (but keep id-like fields as strings)
  if (!Number.isNaN(Number(val)) && val.trim() !== '') {
    if (key === 'id' || key.endsWith('Id') || key === 'userId' || /Id$/.test(key)) return String(val);
    return Number(val);
  }

  return val;
}

(async () => {
  const sqlitePath = path.join(__dirname, '..', 'prisma', 'dev.db');
  if (!fs.existsSync(sqlitePath)) {
    console.error('Local sqlite DB not found at', sqlitePath);
    process.exit(1);
  }

  // list tables
  const rawTables = execSync(`sqlite3 ${sqlitePath} "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"`, { encoding: 'utf8' });
  const tables = rawTables.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  // exclude the User table (prisma model name is 'User'), CallRate (already migrated), and _prisma_migrations
  const exclude = new Set(['User', 'user', 'users', 'CallRate', 'callrate', '_prisma_migrations', 'prisma_migrations', 'Session']);
  // Note: Session model might be used by NextAuth; user asked to exclude users only, but Sessions references users; we currently leave Session in the exclude set to avoid dangling user refs.

  // Build list of tables to migrate (case-insensitive exclude)
  const excludeLc = new Set(Array.from(exclude).map(s => s.toLowerCase()));
  const toMigrate = tables.filter(t => !excludeLc.has(t.toLowerCase()));

  console.log('Found tables:', tables.join(', '));
  console.log('Will migrate (excluding User):', toMigrate.join(', '));

  const prisma = new PrismaClient();
  await prisma.$connect();

  const summary = {};

  for (const table of toMigrate) {
    try {
      console.log('\nExporting table', table);
      const csvPath = path.join(__dirname, '..', 'prisma', `${table}_export.csv`);
      execSync(`sqlite3 ${sqlitePath} -header -csv "SELECT * FROM \"${table}\";" > ${csvPath}`);
      const csvText = fs.readFileSync(csvPath, 'utf8');
      const rows = parseCsv(csvText);
      if (rows.length <= 1) {
        console.log('  No rows for', table);
        summary[table] = { processed: 0, inserted: 0, skipped: 0 };
        continue;
      }
      const header = rows[0];
      const dataRows = rows.slice(1);

      console.log(`  Parsed ${dataRows.length} rows for ${table}`);

      const modelName = toPrismaModelName(table);
      const clientModel = prisma[modelName];
      if (!clientModel) {
        console.warn(`  Prisma client model for ${table} not found (expected property prisma.${modelName}). Skipping.`);
        summary[table] = { processed: dataRows.length, inserted: 0, skipped: dataRows.length };
        continue;
      }

      let processed = 0, success = 0, skipped = 0;
      for (const r of dataRows) {
        if (r.length === 1 && r[0] === '') continue;
        const obj = {};
        for (let i = 0; i < header.length; i++) {
          const key = header[i];
          obj[key] = r[i] === undefined ? '' : r[i];
        }

        // coerce values
        const data = {};
        for (const k of Object.keys(obj)) {
          data[k] = coerceValue(k, obj[k]);
        }

        // Use id-based upsert if id present
        if (data.id) {
          try {
            await clientModel.upsert({ where: { id: data.id }, update: data, create: data });
            success++;
          } catch (err) {
            // foreign key or type errors -> skip and log
            console.error(`  Upsert failed for ${table} id=${data.id}:`, err.code || err.message || err);
            skipped++;
          }
        } else {
          // no id: try create and catch duplicates
          try {
            await clientModel.create({ data });
            success++;
          } catch (err) {
            console.error(`  Create failed for ${table} (no id):`, err.code || err.message || err);
            skipped++;
          }
        }
        processed++;
      }

      summary[table] = { processed, inserted: success, skipped };
      console.log(`  Table ${table} done: processed=${processed} inserted/updated=${success} skipped=${skipped}`);
    } catch (err) {
      console.error(`Error migrating table ${table}:`, err.message || err);
      summary[table] = { processed: 0, inserted: 0, skipped: 0, error: err.message || err };
    }
  }

  console.log('\nMigration summary:');
  console.dir(summary, { depth: null });

  await prisma.$disconnect();
})();
