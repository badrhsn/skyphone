#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

// Mapping CSV caller ID country names to short codes for the UI
const callerIdCountryMapping = {
  'United States': 'US',
  'Philippines': 'PH', 
  'Indonesia': 'ID',
  'Thailand': 'TH'
};

// CSV file configuration
const csvFiles = [
  {
    path: '/Users/badr/Desktop/call-rates-us.csv',
    callerIdCountry: 'United States'
  },
  {
    path: '/Users/badr/Desktop/call-rates-ph.csv', 
    callerIdCountry: 'Philippines'
  },
  {
    path: '/Users/badr/Desktop/call-rates-id.csv',
    callerIdCountry: 'Indonesia'
  },
  {
    path: '/Users/badr/Desktop/call-rates-th.csv',
    callerIdCountry: 'Thailand'
  }
];

async function importRatesFromCSV(filePath, expectedCallerIdCountry) {
  return new Promise((resolve, reject) => {
    const rates = [];
    
    console.log(`📁 Reading ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Validate that this row matches expected caller ID country
          const csvCallerIdCountry = row['Caller ID Country']?.trim();
          if (csvCallerIdCountry !== expectedCallerIdCountry) {
            console.warn(`⚠️  Skipping row with unexpected caller ID country: ${csvCallerIdCountry}, expected: ${expectedCallerIdCountry}`);
            return;
          }

          const destinationCountry = row['Destination Country']?.trim();
          const destinationCode = row['Destination Code']?.trim();
          const landlinePrice = parseFloat(row['Landline Price']);
          const mobilePrice = parseFloat(row['Mobile Price']);

          if (!destinationCountry || !destinationCode || isNaN(landlinePrice)) {
            console.warn(`⚠️  Skipping invalid row: ${JSON.stringify(row)}`);
            return;
          }

          // Map country name to short code for our system
          const callerIdCountryCode = callerIdCountryMapping[csvCallerIdCountry] || csvCallerIdCountry;

          // Create rate record (we'll store landline rates - mobile rates are calculated as landline * 1.25 in the UI)
          rates.push({
            country: destinationCountry,
            countryCode: destinationCode,
            callerIdCountry: callerIdCountryCode,
            rate: landlinePrice,
            currency: 'USD',
            isActive: true,
            // Note: We're not storing mobile rates separately as the UI calculates them
            // If you need to store both, we could add a mobileRate field to the schema
          });

        } catch (error) {
          console.warn(`⚠️  Error processing row: ${error.message}`);
        }
      })
      .on('end', () => {
        console.log(`✅ Parsed ${rates.length} rates from ${path.basename(filePath)}`);
        resolve(rates);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function importAllCSVFiles() {
  console.log('🚀 Starting import of caller ID country rates...\n');
  
  let totalImported = 0;
  const importSummary = [];

  try {
    for (const csvFile of csvFiles) {
      console.log(`\n📊 Processing ${csvFile.callerIdCountry} rates...`);
      
      // Import rates from CSV
      const rates = await importRatesFromCSV(csvFile.path, csvFile.callerIdCountry);
      
      if (rates.length === 0) {
        console.log(`⚠️  No valid rates found in ${csvFile.path}`);
        continue;
      }

      console.log(`💾 Importing ${rates.length} rates for ${csvFile.callerIdCountry}...`);

      // Batch import with upsert to handle duplicates
      let importedCount = 0;
      for (const rate of rates) {
        try {
          await prisma.callRate.upsert({
            where: {
              countryCode_callerIdCountry: {
                countryCode: rate.countryCode,
                callerIdCountry: rate.callerIdCountry
              }
            },
            update: {
              country: rate.country,
              rate: rate.rate,
              currency: rate.currency,
              isActive: rate.isActive,
              updatedAt: new Date()
            },
            create: rate
          });
          importedCount++;
        } catch (error) {
          console.warn(`⚠️  Failed to import rate for ${rate.country} (${rate.countryCode}): ${error.message}`);
        }
      }

      console.log(`✅ Successfully imported ${importedCount}/${rates.length} rates for ${csvFile.callerIdCountry}`);
      totalImported += importedCount;
      
      importSummary.push({
        callerIdCountry: csvFile.callerIdCountry,
        code: callerIdCountryMapping[csvFile.callerIdCountry],
        imported: importedCount,
        total: rates.length
      });
    }

    // Display summary
    console.log('\n📈 Import Summary:');
    console.log('================');
    for (const summary of importSummary) {
      console.log(`${summary.code.padEnd(3)} | ${summary.callerIdCountry.padEnd(15)} | ${summary.imported.toString().padStart(3)} rates imported`);
    }
    console.log('================');
    console.log(`🎉 Total: ${totalImported} rates imported successfully!`);

    // Verify the import
    console.log('\n🔍 Verification:');
    const totalRecords = await prisma.callRate.count();
    const callerIdCountries = await prisma.callRate.groupBy({
      by: ['callerIdCountry'],
      _count: true
    });
    
    console.log(`📊 Total records in database: ${totalRecords}`);
    console.log('📊 Records by caller ID country:');
    for (const group of callerIdCountries) {
      console.log(`   ${group.callerIdCountry}: ${group._count} rates`);
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importAllCSVFiles();