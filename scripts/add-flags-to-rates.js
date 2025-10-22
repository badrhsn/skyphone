#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Country code to flag mapping
const countryFlags = {
  // Major countries
  "US": "🇺🇸", "CA": "🇨🇦", "GB": "🇬🇧", "AU": "🇦🇺", "DE": "🇩🇪", "FR": "🇫🇷",
  "IT": "🇮🇹", "ES": "🇪🇸", "NL": "🇳🇱", "BE": "🇧🇪", "CH": "🇨🇭", "AT": "🇦🇹",
  "SE": "🇸🇪", "NO": "🇳🇴", "DK": "🇩🇰", "FI": "🇫🇮", "IE": "🇮🇪", "PT": "🇵🇹",
  
  // Asia Pacific
  "JP": "🇯🇵", "CN": "🇨🇳", "KR": "🇰🇷", "IN": "🇮🇳", "TH": "🇹🇭", "VN": "🇻🇳",
  "PH": "🇵🇭", "ID": "🇮🇩", "MY": "🇲🇾", "SG": "🇸🇬", "HK": "🇭🇰", "TW": "🇹🇼",
  "BD": "🇧🇩", "PK": "🇵🇰", "LK": "🇱🇰", "NP": "🇳🇵", "MM": "🇲🇲", "KH": "🇰🇭",
  "LA": "🇱🇦", "BN": "🇧🇳", "MO": "🇲🇴", "MN": "🇲🇳", "KP": "🇰🇵", "BT": "🇧🇹",
  
  // Middle East
  "AE": "🇦🇪", "SA": "🇸🇦", "QA": "🇶🇦", "KW": "🇰🇼", "BH": "🇧🇭", "OM": "🇴🇲",
  "IL": "🇮🇱", "JO": "🇯🇴", "LB": "🇱🇧", "SY": "🇸🇾", "IQ": "🇮🇶", "IR": "🇮🇷",
  "TR": "🇹🇷", "CY": "🇨🇾", "GE": "🇬🇪", "AM": "🇦🇲", "AZ": "🇦🇿", "YE": "🇾🇪",
  
  // Africa
  "ZA": "🇿🇦", "EG": "🇪🇬", "NG": "🇳🇬", "KE": "🇰🇪", "ET": "🇪🇹", "UG": "🇺🇬",
  "TZ": "🇹🇿", "RW": "🇷🇼", "GH": "🇬🇭", "SN": "🇸🇳", "CI": "🇨🇮", "CM": "🇨🇲",
  "MA": "🇲🇦", "DZ": "🇩🇿", "TN": "🇹🇳", "LY": "🇱🇾", "SD": "🇸🇩", "ZW": "🇿🇼",
  "BW": "🇧🇼", "MZ": "🇲🇿", "MG": "🇲🇬", "MW": "🇲🇼", "ZM": "🇿🇲", "NA": "🇳🇦",
  
  // Americas
  "MX": "🇲🇽", "BR": "🇧🇷", "AR": "🇦🇷", "CL": "🇨🇱", "CO": "🇨🇴", "PE": "🇵🇪",
  "VE": "🇻🇪", "EC": "🇪🇨", "UY": "🇺🇾", "PY": "🇵🇾", "BO": "🇧🇴", "CR": "🇨🇷",
  "PA": "🇵🇦", "GT": "🇬🇹", "HN": "🇭🇳", "SV": "🇸🇻", "NI": "🇳🇮", "BZ": "🇧🇿",
  "JM": "🇯🇲", "CU": "🇨🇺", "DO": "🇩🇴", "HT": "🇭🇹", "TT": "🇹🇹", "GY": "🇬🇾",
  "SR": "🇸🇷", "GF": "🇬🇫", "FK": "🇫🇰", "AG": "🇦🇬", "BB": "🇧🇧", "BS": "🇧🇸",
  
  // Europe (additional)
  "RU": "🇷🇺", "UA": "🇺🇦", "PL": "🇵🇱", "RO": "🇷🇴", "CZ": "🇨🇿", "HU": "🇭🇺",
  "BG": "🇧🇬", "HR": "🇭🇷", "RS": "🇷🇸", "SI": "🇸🇮", "SK": "🇸🇰", "BA": "🇧🇦",
  "MK": "🇲🇰", "AL": "🇦🇱", "ME": "🇲🇪", "XK": "🇽🇰", "MD": "🇲🇩", "BY": "🇧🇾",
  "LT": "🇱🇹", "LV": "🇱🇻", "EE": "🇪🇪", "MT": "🇲🇹", "LU": "🇱🇺", "LI": "🇱🇮",
  "AD": "🇦🇩", "MC": "🇲🇨", "SM": "🇸🇲", "VA": "🇻🇦", "IS": "🇮🇸", "GL": "🇬🇱",
  "FO": "🇫🇴", "GR": "🇬🇷", "CY": "🇨🇾",
  
  // Oceania
  "NZ": "🇳🇿", "FJ": "🇫🇯", "PG": "🇵🇬", "NC": "🇳🇨", "VU": "🇻🇺", "SB": "🇸🇧",
  "WS": "🇼🇸", "TO": "🇹🇴", "KI": "🇰🇮", "TV": "🇹🇻", "NR": "🇳🇷", "PW": "🇵🇼",
  "MH": "🇲🇭", "FM": "🇫🇲", "GU": "🇬🇺", "AS": "🇦🇸", "MP": "🇲🇵", "CK": "🇨🇰",
  "NU": "🇳🇺", "TK": "🇹🇰", "WF": "🇼🇫", "PF": "🇵🇫",
  
  // Additional codes and special cases
  "1": "🇺🇸",     // North America (US/Canada)
  "7": "🇷🇺",     // Russia/Kazakhstan
  "20": "🇪🇬",    // Egypt
  "27": "🇿🇦",    // South Africa  
  "30": "🇬🇷",    // Greece
  "31": "🇳🇱",    // Netherlands
  "32": "🇧🇪",    // Belgium
  "33": "🇫🇷",    // France
  "34": "🇪🇸",    // Spain
  "36": "🇭🇺",    // Hungary
  "39": "🇮🇹",    // Italy
  "40": "🇷🇴",    // Romania
  "41": "🇨🇭",    // Switzerland
  "43": "🇦🇹",    // Austria
  "44": "🇬🇧",    // United Kingdom
  "45": "🇩🇰",    // Denmark
  "46": "🇸🇪",    // Sweden
  "47": "🇳🇴",    // Norway
  "48": "🇵🇱",    // Poland
  "49": "🇩🇪",    // Germany
  "51": "🇵🇪",    // Peru
  "52": "🇲🇽",    // Mexico
  "53": "🇨🇺",    // Cuba
  "54": "🇦🇷",    // Argentina
  "55": "🇧🇷",    // Brazil
  "56": "🇨🇱",    // Chile
  "57": "🇨🇴",    // Colombia
  "58": "🇻🇪",    // Venezuela
  "60": "🇲🇾",    // Malaysia
  "61": "🇦🇺",    // Australia
  "62": "🇮🇩",    // Indonesia
  "63": "🇵🇭",    // Philippines
  "64": "🇳🇿",    // New Zealand
  "65": "🇸🇬",    // Singapore
  "66": "🇹🇭",    // Thailand
  "81": "🇯🇵",    // Japan
  "82": "🇰🇷",    // South Korea
  "84": "🇻🇳",    // Vietnam
  "86": "🇨🇳",    // China
  "90": "🇹🇷",    // Turkey
  "91": "🇮🇳",    // India
  "92": "🇵🇰",    // Pakistan
  "93": "🇦🇫",    // Afghanistan
  "94": "🇱🇰",    // Sri Lanka
  "95": "🇲🇲",    // Myanmar
  "98": "🇮🇷",    // Iran
  "212": "🇲🇦",   // Morocco
  "213": "🇩🇿",   // Algeria
  "216": "🇹🇳",   // Tunisia
  "218": "🇱🇾",   // Libya
  "220": "🇬🇲",   // Gambia
  "221": "🇸🇳",   // Senegal
  "222": "🇲🇷",   // Mauritania
  "223": "🇲🇱",   // Mali
  "224": "🇬🇳",   // Guinea
  "225": "🇨🇮",   // Côte d'Ivoire
  "226": "🇧🇫",   // Burkina Faso
  "227": "🇳🇪",   // Niger
  "228": "🇹🇬",   // Togo
  "229": "🇧🇯",   // Benin
  "230": "🇲🇺",   // Mauritius
  "231": "🇱🇷",   // Liberia
  "232": "🇸🇱",   // Sierra Leone
  "233": "🇬🇭",   // Ghana
  "234": "🇳🇬",   // Nigeria
  "235": "🇹🇩",   // Chad
  "236": "🇨🇫",   // Central African Republic
  "237": "🇨🇲",   // Cameroon
  "238": "🇨🇻",   // Cape Verde
  "239": "🇸🇹",   // São Tomé and Príncipe
  "240": "🇬🇶",   // Equatorial Guinea
  "241": "🇬🇦",   // Gabon
  "242": "🇨🇬",   // Republic of the Congo
  "243": "🇨🇩",   // Democratic Republic of the Congo
  "244": "🇦🇴",   // Angola
  "245": "🇬🇼",   // Guinea-Bissau
  "246": "🇮🇴",   // British Indian Ocean Territory
  "247": "🇦🇨",   // Ascension Island
  "248": "🇸🇨",   // Seychelles
  "249": "🇸🇩",   // Sudan
  "250": "🇷🇼",   // Rwanda
  "251": "🇪🇹",   // Ethiopia
  "252": "🇸🇴",   // Somalia
  "253": "🇩🇯",   // Djibouti
  "254": "🇰🇪",   // Kenya
  "255": "🇹🇿",   // Tanzania
  "256": "🇺🇬",   // Uganda
  "257": "🇧🇮",   // Burundi
  "258": "🇲🇿",   // Mozambique
  "260": "🇿🇲",   // Zambia
  "261": "🇲🇬",   // Madagascar
  "262": "🇷🇪",   // Réunion/Mayotte
  "263": "🇿🇼",   // Zimbabwe
  "264": "🇳🇦",   // Namibia
  "265": "🇲🇼",   // Malawi
  "266": "🇱🇸",   // Lesotho
  "267": "🇧🇼",   // Botswana
  "268": "🇸🇿",   // Eswatini
  "269": "🇰🇲",   // Comoros
  "290": "🇸🇭",   // Saint Helena
  "291": "🇪🇷",   // Eritrea
  "297": "🇦🇼",   // Aruba
  "298": "🇫🇴",   // Faroe Islands
  "299": "🇬🇱",   // Greenland
  "350": "🇬🇮",   // Gibraltar
  "351": "🇵🇹",   // Portugal
  "352": "🇱🇺",   // Luxembourg
  "353": "🇮🇪",   // Ireland
  "354": "🇮🇸",   // Iceland
  "355": "🇦🇱",   // Albania
  "356": "🇲🇹",   // Malta
  "357": "🇨🇾",   // Cyprus
  "358": "🇫🇮",   // Finland
  "359": "🇧🇬",   // Bulgaria
  "370": "🇱🇹",   // Lithuania
  "371": "🇱🇻",   // Latvia
  "372": "🇪🇪",   // Estonia
  "373": "🇲🇩",   // Moldova
  "374": "🇦🇲",   // Armenia
  "375": "🇧🇾",   // Belarus
  "376": "🇦🇩",   // Andorra
  "377": "🇲🇨",   // Monaco
  "378": "🇸🇲",   // San Marino
  "380": "🇺🇦",   // Ukraine
  "381": "🇷🇸",   // Serbia
  "382": "🇲🇪",   // Montenegro
  "383": "🇽🇰",   // Kosovo
  "385": "🇭🇷",   // Croatia
  "386": "🇸🇮",   // Slovenia
  "387": "🇧🇦",   // Bosnia and Herzegovina
  "389": "🇲🇰",   // North Macedonia
  "420": "🇨🇿",   // Czech Republic
  "421": "🇸🇰",   // Slovakia
  "423": "🇱🇮",   // Liechtenstein
  "500": "🇫🇰",   // Falkland Islands
  "501": "🇧🇿",   // Belize
  "502": "🇬🇹",   // Guatemala
  "503": "🇸🇻",   // El Salvador
  "504": "🇭🇳",   // Honduras
  "505": "🇳🇮",   // Nicaragua
  "506": "🇨🇷",   // Costa Rica
  "507": "🇵🇦",   // Panama
  "508": "🇵🇲",   // Saint Pierre and Miquelon
  "509": "🇭🇹",   // Haiti
  "590": "🇬🇵",   // Guadeloupe
  "591": "🇧🇴",   // Bolivia
  "592": "🇬🇾",   // Guyana
  "593": "🇪🇨",   // Ecuador
  "594": "🇬🇫",   // French Guiana
  "595": "🇵🇾",   // Paraguay
  "596": "🇲🇶",   // Martinique
  "597": "🇸🇷",   // Suriname
  "598": "🇺🇾",   // Uruguay
  "599": "🇨🇼",   // Curaçao
  "670": "🇹🇱",   // Timor-Leste
  "672": "🇦🇶",   // Antarctica
  "673": "🇧🇳",   // Brunei
  "674": "🇳🇷",   // Nauru
  "675": "🇵🇬",   // Papua New Guinea
  "676": "🇹🇴",   // Tonga
  "677": "🇸🇧",   // Solomon Islands
  "678": "🇻🇺",   // Vanuatu
  "679": "🇫🇯",   // Fiji
  "680": "🇵🇼",   // Palau
  "681": "🇼🇫",   // Wallis and Futuna
  "682": "🇨🇰",   // Cook Islands
  "683": "🇳🇺",   // Niue
  "684": "🇦🇸",   // American Samoa
  "685": "🇼🇸",   // Samoa
  "686": "🇰🇮",   // Kiribati
  "687": "🇳🇨",   // New Caledonia
  "688": "🇹🇻",   // Tuvalu
  "689": "🇵🇫",   // French Polynesia
  "690": "🇹🇰",   // Tokelau
  "691": "🇫🇲",   // Federated States of Micronesia
  "692": "🇲🇭",   // Marshall Islands
  "850": "🇰🇵",   // North Korea
  "852": "🇭🇰",   // Hong Kong
  "853": "🇲🇴",   // Macau
  "855": "🇰🇭",   // Cambodia
  "856": "🇱🇦",   // Laos
  "880": "🇧🇩",   // Bangladesh
  "886": "🇹🇼",   // Taiwan
  "960": "🇲🇻",   // Maldives
  "961": "🇱🇧",   // Lebanon
  "962": "🇯🇴",   // Jordan
  "963": "🇸🇾",   // Syria
  "964": "🇮🇶",   // Iraq
  "965": "🇰🇼",   // Kuwait
  "966": "🇸🇦",   // Saudi Arabia
  "967": "🇾🇪",   // Yemen
  "968": "🇴🇲",   // Oman
  "970": "🇵🇸",   // Palestine
  "971": "🇦🇪",   // United Arab Emirates
  "972": "🇮🇱",   // Israel
  "973": "🇧🇭",   // Bahrain
  "974": "🇶🇦",   // Qatar
  "975": "🇧🇹",   // Bhutan
  "976": "🇲🇳",   // Mongolia
  "977": "🇳🇵",   // Nepal
  "992": "🇹🇯",   // Tajikistan
  "993": "🇹🇲",   // Turkmenistan
  "994": "🇦🇿",   // Azerbaijan
  "995": "🇬🇪",   // Georgia
  "996": "🇰🇬",   // Kyrgyzstan
  "998": "🇺🇿",   // Uzbekistan
};

// Function to extract country code from various formats
function extractCountryCode(countryCode) {
  // Remove + and any non-digit characters, then get the country part
  const cleanCode = countryCode.replace(/^\+/, '').replace(/[^0-9]/g, '');
  
  // Handle special cases
  if (cleanCode.startsWith('1')) {
    if (countryCode.includes('CA') || countryCode.includes('Canada')) {
      return 'CA';
    }
    return 'US';
  }
  
  // Try exact match first
  if (countryFlags[cleanCode]) {
    return cleanCode;
  }
  
  // Try progressively shorter codes for compound codes
  for (let i = cleanCode.length; i > 0; i--) {
    const testCode = cleanCode.substring(0, i);
    if (countryFlags[testCode]) {
      return testCode;
    }
  }
  
  return null;
}

// Function to get flag by country name as fallback
function getFlagByCountryName(countryName) {
  const countryToCode = {
    'United States': 'US', 'USA': 'US', 'America': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB', 'UK': 'GB', 'Britain': 'GB', 'England': 'GB',
    'Germany': 'DE', 'Deutschland': 'DE',
    'France': 'FR',
    'Italy': 'IT', 'Italia': 'IT',
    'Spain': 'ES', 'España': 'ES',
    'Netherlands': 'NL', 'Holland': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Ireland': 'IE',
    'Portugal': 'PT',
    'Japan': 'JP',
    'China': 'CN',
    'South Korea': 'KR', 'Korea': 'KR',
    'India': 'IN',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Philippines': 'PH',
    'Indonesia': 'ID',
    'Malaysia': 'MY',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'Taiwan': 'TW',
    'Australia': 'AU',
    'New Zealand': 'NZ',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'Venezuela': 'VE',
    'Ecuador': 'EC',
    'Russia': 'RU',
    'Turkey': 'TR',
    'Israel': 'IL',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE', 'UAE': 'AE',
    'Qatar': 'QA',
    'Kuwait': 'KW',
    'Bahrain': 'BH',
    'Oman': 'OM',
    'Jordan': 'JO',
    'Lebanon': 'LB',
    'Syria': 'SY',
    'Iraq': 'IQ',
    'Iran': 'IR',
    'Egypt': 'EG',
    'South Africa': 'ZA',
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Ethiopia': 'ET',
    'Ghana': 'GH',
    'Morocco': 'MA',
    'Algeria': 'DZ',
    'Tunisia': 'TN',
    'Libya': 'LY',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Sri Lanka': 'LK',
    'Nepal': 'NP',
    'Myanmar': 'MM', 'Burma': 'MM',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Brunei': 'BN',
    'Afghanistan': 'AF',
    'Uzbekistan': 'UZ',
    'Kazakhstan': 'KZ',
    'Kyrgyzstan': 'KG',
    'Tajikistan': 'TJ',
    'Turkmenistan': 'TM',
    'Mongolia': 'MN',
    'North Korea': 'KP',
    'Bhutan': 'BT',
    'Maldives': 'MV'
  };
  
  const code = countryToCode[countryName];
  return code ? countryFlags[code] : null;
}

async function addFlagsToCallRates() {
  console.log('🚀 Starting to add flags to CallRate records...\n');
  
  try {
    // Get all CallRate records
    const callRates = await prisma.callRate.findMany({
      select: {
        id: true,
        country: true,
        countryCode: true,
        flag: true
      }
    });
    
    console.log(`📊 Found ${callRates.length} CallRate records`);
    
    let updated = 0;
    let failed = 0;
    const failedRecords = [];
    
    for (const rate of callRates) {
      try {
        // Skip if already has flag
        if (rate.flag) {
          continue;
        }
        
        let flag = null;
        
        // First try to get flag by country code
        const codeKey = extractCountryCode(rate.countryCode);
        if (codeKey && countryFlags[codeKey]) {
          flag = countryFlags[codeKey];
        }
        
        // If no flag found, try by country name
        if (!flag) {
          flag = getFlagByCountryName(rate.country);
        }
        
        if (flag) {
          await prisma.callRate.update({
            where: { id: rate.id },
            data: { flag: flag }
          });
          updated++;
          console.log(`✅ ${rate.country} (${rate.countryCode}): ${flag}`);
        } else {
          failed++;
          failedRecords.push({
            country: rate.country,
            countryCode: rate.countryCode
          });
          console.log(`❌ ${rate.country} (${rate.countryCode}): No flag found`);
        }
        
      } catch (error) {
        failed++;
        failedRecords.push({
          country: rate.country,
          countryCode: rate.countryCode,
          error: error.message
        });
        console.log(`❌ Error updating ${rate.country}: ${error.message}`);
      }
    }
    
    console.log('\n📈 Summary:');
    console.log('==================');
    console.log(`✅ Successfully updated: ${updated} records`);
    console.log(`❌ Failed: ${failed} records`);
    console.log(`📊 Total processed: ${callRates.length} records`);
    
    if (failedRecords.length > 0) {
      console.log('\n❌ Failed Records:');
      failedRecords.forEach(record => {
        console.log(`   ${record.country} (${record.countryCode})${record.error ? ` - ${record.error}` : ''}`);
      });
    }
    
    // Verify the update
    const flaggedCount = await prisma.callRate.count({
      where: { flag: { not: null } }
    });
    
    console.log(`\n🔍 Verification: ${flaggedCount} records now have flags`);
    
    // Show some examples
    console.log('\n🎌 Sample flagged countries:');
    const samples = await prisma.callRate.findMany({
      where: { flag: { not: null } },
      select: { country: true, countryCode: true, flag: true },
      take: 10
    });
    
    samples.forEach(sample => {
      console.log(`   ${sample.flag} ${sample.country} (${sample.countryCode})`);
    });
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addFlagsToCallRates();