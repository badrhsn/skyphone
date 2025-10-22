#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Country mapping for caller ID countries
const CALLER_ID_COUNTRIES = {
  'US': 'United States',
  'UK': 'United Kingdom', 
  'DE': 'Germany',
  'FR': 'France'
};

async function importRatesFromCSV(csvFilePath, callerIdCountryCode) {
  const rates = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Assuming CSV format: country, countryCode, rate, flag (optional)
        const rate = {
          country: row.country || row.Country,
          countryCode: row.countryCode || row.CountryCode || row.country_code,
          callerIdCountry: callerIdCountryCode,
          rate: parseFloat(row.rate || row.Rate || row.landline_rate),
          flag: row.flag || row.Flag || '🌍',
          currency: 'USD',
          isActive: true
        };
        
        // Validate required fields
        if (rate.country && rate.countryCode && !isNaN(rate.rate)) {
          rates.push(rate);
        } else {
          console.warn(`Skipping invalid row for ${callerIdCountryCode}:`, row);
        }
      })
      .on('end', () => {
        resolve(rates);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function main() {
  try {
    console.log('🚀 Starting rate import with caller ID countries...');
    
    // Clear existing rates
    console.log('🗑️  Clearing existing rates...');
    await prisma.callRate.deleteMany({});
    
    const csvFiles = [
      { file: 'rates_US.csv', callerIdCountry: 'US' },
      { file: 'rates_UK.csv', callerIdCountry: 'UK' },
      { file: 'rates_DE.csv', callerIdCountry: 'DE' },
      { file: 'rates_FR.csv', callerIdCountry: 'FR' }
    ];
    
    let totalImported = 0;
    
    for (const { file, callerIdCountry } of csvFiles) {
      const csvPath = path.join(process.cwd(), 'data', file);
      
      if (!fs.existsSync(csvPath)) {
        console.warn(`⚠️  CSV file not found: ${csvPath}`);
        continue;
      }
      
      console.log(`📊 Processing ${file} for caller ID country: ${CALLER_ID_COUNTRIES[callerIdCountry]} (${callerIdCountry})...`);
      
      try {
        const rates = await importRatesFromCSV(csvPath, callerIdCountry);
        
        if (rates.length > 0) {
          // Import rates individually to handle duplicates
          for (const rate of rates) {
            try {
              await prisma.callRate.create({
                data: rate
              });
            } catch (error) {
              if (error.code === 'P2002') {
                // Unique constraint violation, try to update instead
                await prisma.callRate.update({
                  where: {
                    countryCode_callerIdCountry: {
                      countryCode: rate.countryCode,
                      callerIdCountry: rate.callerIdCountry
                    }
                  },
                  data: {
                    rate: rate.rate,
                    flag: rate.flag,
                    isActive: rate.isActive
                  }
                });
              } else {
                throw error;
              }
            }
          }
          
          console.log(`✅ Imported ${rates.length} rates for ${callerIdCountry}`);
          totalImported += rates.length;
        } else {
          console.warn(`⚠️  No valid rates found in ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Import completed! Total rates imported: ${totalImported}`);
    
    // Show summary
    const summary = await prisma.callRate.groupBy({
      by: ['callerIdCountry'],
      _count: {
        id: true
      }
    });
    
    console.log('\n📈 Summary by Caller ID Country:');
    summary.forEach(({ callerIdCountry, _count }) => {
      console.log(`  ${CALLER_ID_COUNTRIES[callerIdCountry] || callerIdCountry}: ${_count.id} rates`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { importRatesFromCSV, CALLER_ID_COUNTRIES };