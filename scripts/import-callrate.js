const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function parseCsv(csvText) {
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
        // handle CRLF
        // push field and row on newline
        // detect CRLF pair
        // if next is \n and current is \r, consume both
        row.push(field);
        field = '';
        // only push non-empty row (avoid an extra row at EOF)
        rows.push(row);
        row = [];
        if (ch === '\r' && csvText[i + 1] === '\n') i += 2; else i++;
        continue;
      }
      field += ch;
      i++;
    }
  }
  // flush last field/row if any
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const csvPath = path.join(__dirname, '..', 'prisma', 'callrate_export.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found:', csvPath);
      process.exit(1);
    }

    const csvText = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCsv(csvText);
    if (rows.length < 2) {
      console.error('No rows found in CSV');
      process.exit(1);
    }

    const header = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);

    console.log(`Parsed ${dataRows.length} rows (header ${header.length} columns)`);

    await prisma.$connect();

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of dataRows) {
      if (r.length === 1 && r[0] === '') continue; // skip empty rows
      const obj = {};
      for (let j = 0; j < header.length; j++) {
        const key = header[j];
        obj[key] = r[j] === undefined ? '' : r[j];
      }

      // Map fields
      const country = obj.country || null;
      const countryCode = obj.countryCode || null;
      const callerIdCountry = obj.callerIdCountry || null;
      const flag = obj.flag || null;
      const rate = obj.rate ? parseFloat(obj.rate) : 0;
      const currency = obj.currency || 'USD';
      const isActive = obj.isActive === '1' || obj.isActive === 'true' || obj.isActive === 'TRUE' || obj.isActive === 't' ? true : false;

      const createdAt = obj.createdAt ? new Date(Number(obj.createdAt)) : new Date();
      const updatedAt = obj.updatedAt ? new Date(Number(obj.updatedAt)) : new Date();

      const id = obj.id || undefined;

      if (!countryCode || !callerIdCountry) {
        skipped++;
        continue;
      }

      try {
        const upsertRes = await prisma.callRate.upsert({
          where: { countryCode_callerIdCountry: { countryCode, callerIdCountry } },
          update: {
            country,
            flag,
            rate,
            currency,
            isActive,
            updatedAt
          },
          create: {
            id: id || undefined,
            country,
            countryCode,
            callerIdCountry,
            flag,
            rate,
            currency,
            isActive,
            createdAt,
            updatedAt
          }
        });

        // upsert returns the record; we can't easily tell if it was created or updated
        // so do a best-effort: if id provided and matches createdAt maybe new
        inserted++;
      } catch (err) {
        console.error('Upsert failed for', countryCode, callerIdCountry, err.message || err);
      }
    }

    console.log(`Done. processed=${dataRows.length} inserted/updated~=${inserted} skipped=${skipped}`);
  } catch (err) {
    console.error('Error importing call rates:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
