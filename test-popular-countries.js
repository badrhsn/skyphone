#!/usr/bin/env node

async function testPopularCountries() {
  try {
    console.log('🧪 Testing Popular Countries API');
    console.log('================================');
    
    const response = await fetch('http://localhost:3000/api/popular-countries');
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ API Success:', result.success);
      console.log('📊 Number of countries:', result.data.length);
      console.log('\n🌍 Popular Countries:');
      
      result.data.forEach((country, index) => {
        console.log(`${index + 1}. ${country.flag} ${country.name} (${country.code}) - ${country.formattedRate}`);
      });
      
      // Check if flags are from database (not fallback emoji)
      const hasRealFlags = result.data.some(c => c.flag !== '🌍');
      console.log(`\n🎌 Using database flags: ${hasRealFlags ? '✅ YES' : '❌ NO (using fallback)'}`);
      
    } else {
      console.log('❌ API Failed:', result);
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testPopularCountries();