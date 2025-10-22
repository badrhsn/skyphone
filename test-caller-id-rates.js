#!/usr/bin/env node

const fetch = require('node-fetch');

async function testCallerIdRates() {
    const baseUrl = 'http://localhost:3001';
    
    console.log('🧪 Testing Caller ID Country-based Rates System\n');
    
    // Test different caller ID countries
    const countries = ['US', 'UK', 'DE', 'FR'];
    
    for (const callerIdCountry of countries) {
        try {
            console.log(`📞 Testing rates for ${callerIdCountry} caller ID:`);
            
            // Test main rates API
            const ratesResponse = await fetch(`${baseUrl}/api/rates?callerIdCountry=${callerIdCountry}`);
            if (!ratesResponse.ok) {
                console.log(`❌ Error: ${ratesResponse.status} ${ratesResponse.statusText}`);
                continue;
            }
            
            const rates = await ratesResponse.json();
            console.log(`   📊 Found ${rates.length} rates`);
            
            if (rates.length > 0) {
                const sampleRate = rates[0];
                console.log(`   📝 Sample: ${sampleRate.country} (${sampleRate.countryCode}) - $${sampleRate.rate}/min`);
            }
            
            // Test all rates API
            const allRatesResponse = await fetch(`${baseUrl}/api/rates/all?callerIdCountry=${callerIdCountry}`);
            if (allRatesResponse.ok) {
                const allRates = await allRatesResponse.json();
                console.log(`   📈 All rates endpoint: ${allRates.length} rates\n`);
            }
            
        } catch (error) {
            console.log(`❌ Error testing ${callerIdCountry}: ${error.message}\n`);
        }
    }
    
    // Test rate comparison
    console.log('🔍 Comparing rates between countries:');
    try {
        const usRates = await fetch(`${baseUrl}/api/rates?callerIdCountry=US`).then(r => r.json());
        const ukRates = await fetch(`${baseUrl}/api/rates?callerIdCountry=UK`).then(r => r.json());
        
        const usCanadaRate = usRates.find(r => r.countryCode === '+1-CA');
        const ukCanadaRate = ukRates.find(r => r.countryCode === '+1-CA');
        
        if (usCanadaRate && ukCanadaRate) {
            console.log(`   🇺🇸 US caller to Canada: $${usCanadaRate.rate}/min`);
            console.log(`   🇬🇧 UK caller to Canada: $${ukCanadaRate.rate}/min`);
            console.log(`   💰 Difference: $${Math.abs(usCanadaRate.rate - ukCanadaRate.rate).toFixed(3)}/min`);
        }
    } catch (error) {
        console.log(`❌ Error comparing rates: ${error.message}`);
    }
    
    console.log('\n✅ Caller ID rates system test completed!');
}

// Run the test
testCallerIdRates().catch(console.error);