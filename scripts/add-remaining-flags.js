#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Additional flag mappings for countries that weren't matched
const additionalFlags = {
  // Missing from previous script
  'AD': '🇦🇩', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AO': '🇦🇴',
  'AS': '🇦🇸', 'AW': '🇦🇼', 'AX': '🇦🇽', 'AZ': '🇦🇿', 'BA': '🇧🇦', 'BB': '🇧🇧', 'BF': '🇧🇫',
  'BG': '🇧🇬', 'BI': '🇧🇮', 'BJ': '🇧🇯', 'BL': '🇧🇱', 'BM': '🇧🇲', 'BO': '🇧🇴', 'BQ': '🇧🇶',
  'BS': '🇧🇸', 'BW': '🇧🇼', 'BY': '🇧🇾', 'BZ': '🇧🇿', 'CC': '🇨🇨', 'CD': '🇨🇩', 'CF': '🇨🇫',
  'CG': '🇨🇬', 'CI': '🇨🇮', 'CK': '🇨🇰', 'CM': '🇨🇲', 'CR': '🇨🇷', 'CU': '🇨🇺', 'CV': '🇨🇻',
  'CW': '🇨🇼', 'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿', 'DJ': '🇩🇯', 'DM': '🇩🇲', 'DO': '🇩🇴',
  'EE': '🇪🇪', 'EH': '🇪🇭', 'ER': '🇪🇷', 'FJ': '🇫🇯', 'FK': '🇫🇰', 'FM': '🇫🇲', 'FO': '🇫🇴',
  'GA': '🇬🇦', 'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫', 'GG': '🇬🇬', 'GI': '🇬🇮', 'GL': '🇬🇱',
  'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶', 'GR': '🇬🇷', 'GT': '🇬🇹', 'GU': '🇬🇺',
  'GW': '🇬🇼', 'GY': '🇬🇾', 'HN': '🇭🇳', 'HR': '🇭🇷', 'HT': '🇭🇹', 'HU': '🇭🇺', 'IM': '🇮🇲',
  'IO': '🇮🇴', 'IS': '🇮🇸', 'JE': '🇯🇪', 'JM': '🇯🇲', 'KG': '🇰🇬', 'KI': '🇰🇮', 'KM': '🇰🇲',
  'KN': '🇰🇳', 'KY': '🇰🇾', 'KZ': '🇰🇿', 'LC': '🇱🇨', 'LI': '🇱🇮', 'LR': '🇱🇷', 'LS': '🇱🇸',
  'LT': '🇱🇹', 'LU': '🇱🇺', 'LV': '🇱🇻', 'MC': '🇲🇨', 'MD': '🇲🇩', 'ME': '🇲🇪', 'MF': '🇲🇫',
  'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰', 'ML': '🇲🇱', 'MM': '🇲🇲', 'MO': '🇲🇴', 'MP': '🇲🇵',
  'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸', 'MT': '🇲🇹', 'MU': '🇲🇺', 'MV': '🇲🇻', 'MW': '🇲🇼',
  'MZ': '🇲🇿', 'NA': '🇳🇦', 'NC': '🇳🇨', 'NE': '🇳🇪', 'NF': '🇳🇫', 'NI': '🇳🇮', 'PA': '🇵🇦',
  'PF': '🇵🇫', 'PG': '🇵🇬', 'PL': '🇵🇱', 'PM': '🇵🇲', 'PR': '🇵🇷', 'PS': '🇵🇸', 'PW': '🇵🇼',
  'PY': '🇵🇾', 'RE': '🇷🇪', 'RO': '🇷🇴', 'RS': '🇷🇸', 'RW': '🇷🇼', 'SB': '🇸🇧', 'SC': '🇸🇨',
  'SD': '🇸🇩', 'SI': '🇸🇮', 'SJ': '🇸🇯', 'SK': '🇸🇰', 'SL': '🇸🇱', 'SM': '🇸🇲', 'SN': '🇸🇳',
  'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸', 'SV': '🇸🇻', 'SX': '🇸🇽', 'SZ': '🇸🇿', 'TC': '🇹🇨',
  'TD': '🇹🇩', 'TG': '🇹🇬', 'TJ': '🇹🇯', 'TL': '🇹🇱', 'TM': '🇹🇲', 'TO': '🇹🇴', 'TT': '🇹🇹',
  'TZ': '🇹🇿', 'UA': '🇺🇦', 'UG': '🇺🇬', 'UY': '🇺🇾', 'UZ': '🇺🇿', 'VA': '🇻🇦', 'VC': '🇻🇨',
  'VG': '🇻🇬', 'VI': '🇻🇮', 'VU': '🇻🇺', 'WF': '🇼🇫', 'WS': '🇼🇸', 'XK': '🇽🇰', 'YE': '🇾🇪',
  'YT': '🇾🇹', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
};

// Country name to flag mapping for difficult cases
const countryNameToFlag = {
  'Andorra': '🇦🇩', 'Afghanistan': '🇦🇫', 'Antigua and Barbuda': '🇦🇬', 'Anguilla': '🇦🇮',
  'Albania': '🇦🇱', 'Armenia': '🇦🇲', 'Angola': '🇦🇴', 'American Samoa': '🇦🇸',
  'Aruba': '🇦🇼', 'Aland': '🇦🇽', 'Azerbaijan': '🇦🇿', 'Bosnia and Herzegovina': '🇧🇦',
  'Barbados': '🇧🇧', 'Burkina Faso': '🇧🇫', 'Bulgaria': '🇧🇬', 'Burundi': '🇧🇮',
  'Benin': '🇧🇯', 'Saint Barthelemy': '🇧🇱', 'Bermuda': '🇧🇲', 'Bolivia': '🇧🇴',
  'Bonaire': '🇧🇶', 'Bahamas': '🇧🇸', 'Botswana': '🇧🇼', 'Belarus': '🇧🇾',
  'Belize': '🇧🇿', 'Cocos (Keeling) Islands': '🇨🇨', 'Democratic Republic of the Congo': '🇨🇩',
  'Central African Republic': '🇨🇫', 'Republic of the Congo': '🇨🇬', 'Ivory Coast': '🇨🇮',
  'Cook Islands': '🇨🇰', 'Cameroon': '🇨🇲', 'Costa Rica': '🇨🇷', 'Cuba': '🇨🇺',
  'Cape Verde': '🇨🇻', 'Curacao': '🇨🇼', 'Christmas Island': '🇨🇽', 'Cyprus': '🇨🇾',
  'Czech Republic': '🇨🇿', 'Djibouti': '🇩🇯', 'Dominica': '🇩🇲', 'Dominican Republic': '🇩🇴',
  'Estonia': '🇪🇪', 'Western Sahara': '🇪🇭', 'Eritrea': '🇪🇷', 'Fiji': '🇫🇯',
  'Falkland Islands': '🇫🇰', 'Micronesia': '🇫🇲', 'Faroe Islands': '🇫🇴', 'Gabon': '🇬🇦',
  'Grenada': '🇬🇩', 'Georgia': '🇬🇪', 'French Guiana': '🇬🇫', 'Guernsey': '🇬🇬',
  'Gibraltar': '🇬🇮', 'Greenland': '🇬🇱', 'Gambia': '🇬🇲', 'Guinea': '🇬🇳',
  'Guadeloupe': '🇬🇵', 'Equatorial Guinea': '🇬🇶', 'Greece': '🇬🇷', 'Guatemala': '🇬🇹',
  'Guam': '🇬🇺', 'Guinea-Bissau': '🇬🇼', 'Guyana': '🇬🇾', 'Honduras': '🇭🇳',
  'Croatia': '🇭🇷', 'Haiti': '🇭🇹', 'Hungary': '🇭🇺', 'Isle of Man': '🇮🇲',
  'British Indian Ocean Territory': '🇮🇴', 'Iceland': '🇮🇸', 'Jersey': '🇯🇪', 'Jamaica': '🇯🇲',
  'Kyrgyzstan': '🇰🇬', 'Kiribati': '🇰🇮', 'Comoros': '🇰🇲', 'Saint Kitts and Nevis': '🇰🇳',
  'Cayman Islands': '🇰🇾', 'Kazakhstan': '🇰🇿', 'Saint Lucia': '🇱🇨', 'Liechtenstein': '🇱🇮',
  'Liberia': '🇱🇷', 'Lesotho': '🇱🇸', 'Lithuania': '🇱🇹', 'Luxembourg': '🇱🇺',
  'Latvia': '🇱🇻', 'Monaco': '🇲🇨', 'Moldova': '🇲🇩', 'Montenegro': '🇲🇪',
  'Saint Martin': '🇲🇫', 'Madagascar': '🇲🇬', 'Marshall Islands': '🇲🇭', 'North Macedonia': '🇲🇰',
  'Mali': '🇲🇱', 'Myanmar (Burma)': '🇲🇲', 'Myanmar': '🇲🇲', 'Macao': '🇲🇴',
  'Northern Mariana Islands': '🇲🇵', 'Martinique': '🇲🇶', 'Mauritania': '🇲🇷', 'Montserrat': '🇲🇸',
  'Malta': '🇲🇹', 'Mauritius': '🇲🇺', 'Maldives': '🇲🇻', 'Malawi': '🇲🇼',
  'Mozambique': '🇲🇿', 'Namibia': '🇳🇦', 'New Caledonia': '🇳🇨', 'Niger': '🇳🇪',
  'Norfolk Island': '🇳🇫', 'Nicaragua': '🇳🇮', 'Panama': '🇵🇦', 'French Polynesia': '🇵🇫',
  'Papua New Guinea': '🇵🇬', 'Poland': '🇵🇱', 'Saint Pierre and Miquelon': '🇵🇲', 'Puerto Rico': '🇵🇷',
  'Palestine': '🇵🇸', 'Palau': '🇵🇼', 'Paraguay': '🇵🇾', 'Reunion': '🇷🇪',
  'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Rwanda': '🇷🇼', 'Solomon Islands': '🇸🇧',
  'Seychelles': '🇸🇨', 'Sudan': '🇸🇩', 'Slovenia': '🇸🇮', 'Svalbard and Jan Mayen': '🇸🇯',
  'Slovakia': '🇸🇰', 'Sierra Leone': '🇸🇱', 'San Marino': '🇸🇲', 'Senegal': '🇸🇳',
  'Somalia': '🇸🇴', 'Suriname': '🇸🇷', 'South Sudan': '🇸🇸', 'El Salvador': '🇸🇻',
  'Sint Maarten': '🇸🇽', 'Eswatini': '🇸🇿', 'Turks and Caicos Islands': '🇹🇨', 'Chad': '🇹🇩',
  'Togo': '🇹🇬', 'Tajikistan': '🇹🇯', 'East Timor': '🇹🇱', 'Turkmenistan': '🇹🇲',
  'Tonga': '🇹🇴', 'Trinidad and Tobago': '🇹🇹', 'Tanzania': '🇹🇿', 'Ukraine': '🇺🇦',
  'Uganda': '🇺🇬', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿', 'Vatican City': '🇻🇦',
  'Saint Vincent and the Grenadines': '🇻🇨', 'British Virgin Islands': '🇻🇬', 'U.S. Virgin Islands': '🇻🇮',
  'Vanuatu': '🇻🇺', 'Wallis and Futuna': '🇼🇫', 'Samoa': '🇼🇸', 'Kosovo': '🇽🇰',
  'Yemen': '🇾🇪', 'Mayotte': '🇾🇹', 'Zambia': '🇿🇲', 'Zimbabwe': '🇿🇼'
};

async function addRemainingFlags() {
  console.log('🚀 Adding flags to remaining CallRate records...\n');
  
  try {
    // Get all CallRate records without flags
    const callRatesWithoutFlags = await prisma.callRate.findMany({
      where: { flag: null },
      select: {
        id: true,
        country: true,
        countryCode: true
      }
    });
    
    console.log(`📊 Found ${callRatesWithoutFlags.length} records without flags`);
    
    let updated = 0;
    let failed = 0;
    
    for (const rate of callRatesWithoutFlags) {
      try {
        let flag = null;
        
        // Try by country code (2-letter ISO codes)
        if (additionalFlags[rate.countryCode]) {
          flag = additionalFlags[rate.countryCode];
        }
        
        // Try by country name
        if (!flag && countryNameToFlag[rate.country]) {
          flag = countryNameToFlag[rate.country];
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
          console.log(`❌ ${rate.country} (${rate.countryCode}): No flag found`);
        }
        
      } catch (error) {
        failed++;
        console.log(`❌ Error updating ${rate.country}: ${error.message}`);
      }
    }
    
    console.log('\n📈 Additional Update Summary:');
    console.log('==================');
    console.log(`✅ Successfully updated: ${updated} records`);
    console.log(`❌ Still missing flags: ${failed} records`);
    
    // Final verification
    const totalFlagged = await prisma.callRate.count({
      where: { flag: { not: null } }
    });
    
    const totalRecords = await prisma.callRate.count();
    
    console.log(`\n🔍 Final Status:`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`🎌 Records with flags: ${totalFlagged}`);
    console.log(`📈 Coverage: ${((totalFlagged / totalRecords) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addRemainingFlags();