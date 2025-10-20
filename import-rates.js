const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importCSVFile(filePath) {
  try {
    console.log(`\nImporting: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.log('❌ CSV file must have at least a header and one data row');
      return;
    }

    // Parse CSV
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const dataLines = lines.slice(1);

    console.log('📋 CSV Header:', header);

    // Find column indices - be flexible with column names
    const getColumnIndex = (possibleNames) => {
      for (const name of possibleNames) {
        const index = header.findIndex(h => h.includes(name));
        if (index !== -1) return index;
      }
      return -1;
    };

    const countryIndex = getColumnIndex(['country', 'destination', 'region', 'name']);
    const codeIndex = getColumnIndex(['code', 'prefix', 'dial_code', 'country_code']);
    const rateIndex = getColumnIndex(['rate', 'price', 'cost', 'per_minute']);
    const currencyIndex = getColumnIndex(['currency', 'curr']);

    console.log('🔍 Column indices:', { countryIndex, codeIndex, rateIndex, currencyIndex });

    if (countryIndex === -1 || codeIndex === -1 || rateIndex === -1) {
      console.log('❌ CSV must contain columns for country, country code, and rate');
      console.log('   Found columns:', header.join(', '));
      return;
    }

    let imported = 0;
    let errors = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i];
        if (!line.trim()) continue;

        // Parse CSV line (handle quoted fields)
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            columns.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        columns.push(current.trim()); // Add the last column

        if (columns.length <= Math.max(countryIndex, codeIndex, rateIndex)) {
          errors.push(`Row ${i + 2}: Not enough columns`);
          continue;
        }

        const country = columns[countryIndex]?.replace(/"/g, '').trim();
        const countryCode = columns[codeIndex]?.replace(/"/g, '').trim();
        const rateStr = columns[rateIndex]?.replace(/"/g, '').trim();
        const currency = currencyIndex !== -1 ? columns[currencyIndex]?.replace(/"/g, '').trim() || 'USD' : 'USD';

        if (!country || !countryCode || !rateStr) {
          errors.push(`Row ${i + 2}: Missing required data`);
          continue;
        }

        const rate = parseFloat(rateStr);
        if (isNaN(rate) || rate < 0) {
          errors.push(`Row ${i + 2}: Invalid rate: ${rateStr}`);
          continue;
        }

        // Create or update rate
        await prisma.callRate.upsert({
          where: { countryCode },
          update: {
            country,
            rate,
            currency,
            updatedAt: new Date()
          },
          create: {
            country,
            countryCode,
            rate,
            currency,
            isActive: true
          }
        });

        imported++;
        
        // Show progress every 100 rows
        if (imported % 100 === 0) {
          console.log(`   📊 Processed ${imported} rows...`);
        }
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    console.log(`✅ Import complete: ${imported} rates imported`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} errors occurred:`);
      errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`);
      }
    }

  } catch (error) {
    console.error(`❌ Error importing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting CSV import process...');
  
  // List of CSV files to import (update these paths to match your files)
  const csvFiles = [
    '/Users/badr/Desktop/call-rates id ID.csv',
    '/Users/badr/Desktop/call-rates us id .csv',
    '/Users/badr/Desktop/call-rates id TH.csv',
    '/Users/badr/Desktop/call-rates id PH.csv'
  ];

  for (const filePath of csvFiles) {
    await importCSVFile(filePath);
  }

  console.log('\n🎉 All imports completed!');
  
  // Show summary
  const totalRates = await prisma.callRate.count();
  const activeRates = await prisma.callRate.count({ where: { isActive: true } });
  
  console.log(`\n📊 Database Summary:`);
  console.log(`   Total rates: ${totalRates}`);
  console.log(`   Active rates: ${activeRates}`);
  console.log(`   Inactive rates: ${totalRates - activeRates}`);
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });