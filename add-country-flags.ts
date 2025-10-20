// Script to add flag emojis to existing countries in the database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Array of country mappings to handle duplicate country codes
const countryMappings = [
  // North America (+1 countries)
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+1", country: "Jamaica", flag: "🇯🇲" },
  { code: "+1", country: "Bahamas", flag: "�🇸" },
  { code: "+1", country: "Barbados", flag: "🇧🇧" },
  { code: "+1", country: "Trinidad and Tobago", flag: "��" },
  { code: "+1", country: "Anguilla", flag: "🇦🇮" },
  { code: "+1", country: "Antigua and Barbuda", flag: "��" },
  { code: "+1", country: "US Virgin Islands", flag: "🇻🇮" },
  { code: "+1", country: "Puerto Rico", flag: "��" },
  { code: "+1", country: "Northern Mariana Islands", flag: "🇲🇵" },
  { code: "+1", country: "Guam", flag: "��" },
  { code: "+1", country: "Saint Lucia", flag: "🇱🇨" },
  { code: "+1", country: "Saint Vincent and the Grenadines", flag: "��" },
  { code: "+1", country: "Grenada", flag: "🇬🇩" },
  { code: "+1", country: "Dominica", flag: "��" },
  { code: "+1", country: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "+1", country: "Turks and Caicos Islands", flag: "��" },
  { code: "+1", country: "Cayman Islands", flag: "🇰🇾" },
  { code: "+1", country: "Bermuda", flag: "��" },
  { code: "+1", country: "British Virgin Islands", flag: "🇻🇬" },

  // Russia/Kazakhstan (+7)
  { code: "+7", country: "Russia", flag: "��" },
  { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },

  // Europe
  { code: "+44", country: "United Kingdom", flag: "��" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "�🇪" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "��" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+32", country: "Belgium", flag: "��" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+43", country: "Austria", flag: "��" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+46", country: "Sweden", flag: "��" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+358", country: "Finland", flag: "��" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+351", country: "Portugal", flag: "🇵�" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+48", country: "Poland", flag: "��" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+421", country: "Slovakia", flag: "🇸🇰" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+385", country: "Croatia", flag: "🇭🇷" },
  { code: "+386", country: "Slovenia", flag: "��" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+376", country: "Andorra", flag: "🇦🇩" },

  // Asia-Pacific
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+853", country: "Macau", flag: "🇲🇴" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+84", country: "Vietnam", flag: "��" },
  { code: "+63", country: "Philippines", flag: "��" },
  { code: "+62", country: "Indonesia", flag: "🇮�" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+95", country: "Myanmar", flag: "��" },
  { code: "+855", country: "Cambodia", flag: "��" },
  { code: "+856", country: "Laos", flag: "🇱🇦" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+93", country: "Afghanistan", flag: "🇦🇫" },

  // Middle East
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "�🇦" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+963", country: "Syria", flag: "🇸🇾" },
  { code: "+964", country: "Iraq", flag: "🇮�" },
  { code: "+98", country: "Iran", flag: "�🇷" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },

  // Africa
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+234", country: "Nigeria", flag: "��" },
  { code: "+233", country: "Ghana", flag: "��" },
  { code: "+254", country: "Kenya", flag: "��" },
  { code: "+255", country: "Tanzania", flag: "��" },
  { code: "+256", country: "Uganda", flag: "��" },
  { code: "+250", country: "Rwanda", flag: "��" },
  { code: "+251", country: "Ethiopia", flag: "🇪�" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+218", country: "Libya", flag: "🇱🇾" },
  { code: "+244", country: "Angola", flag: "🇦🇴" },

  // South America
  { code: "+55", country: "Brazil", flag: "�🇷" },
  { code: "+54", country: "Argentina", flag: "��" },
  { code: "+56", country: "Chile", flag: "🇨�" },
  { code: "+57", country: "Colombia", flag: "��" },
  { code: "+51", country: "Peru", flag: "�🇪" },
  { code: "+58", country: "Venezuela", flag: "��" },
  { code: "+593", country: "Ecuador", flag: "��" },
  { code: "+595", country: "Paraguay", flag: "�🇾" },
  { code: "+598", country: "Uruguay", flag: "��" },
  { code: "+591", country: "Bolivia", flag: "��" },
  { code: "+597", country: "Suriname", flag: "��" },
  { code: "+594", country: "French Guiana", flag: "🇬�" },
  { code: "+592", country: "Guyana", flag: "🇬🇾" },

  // Central America & Mexico
  { code: "+52", country: "Mexico", flag: "��" },
  { code: "+503", country: "El Salvador", flag: "��" },
  { code: "+502", country: "Guatemala", flag: "��" },
  { code: "+504", country: "Honduras", flag: "��" },
  { code: "+505", country: "Nicaragua", flag: "��" },
  { code: "+506", country: "Costa Rica", flag: "🇨�" },
  { code: "+507", country: "Panama", flag: "��" },
  { code: "+53", country: "Cuba", flag: "��" },

  // Eastern Europe & Former Soviet
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+375", country: "Belarus", flag: "🇧🇾" },
  { code: "+373", country: "Moldova", flag: "🇲🇩" },
  { code: "+381", country: "Serbia", flag: "🇷🇸" },
  { code: "+382", country: "Montenegro", flag: "🇲🇪" },
  { code: "+387", country: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+383", country: "Kosovo", flag: "�🇰" },
  { code: "+389", country: "North Macedonia", flag: "🇲🇰" },
  { code: "+355", country: "Albania", flag: "��" },
  { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
  { code: "+992", country: "Tajikistan", flag: "🇹�" },
  { code: "+993", country: "Turkmenistan", flag: "��" },
  { code: "+994", country: "Azerbaijan", flag: "��" },
  { code: "+374", country: "Armenia", flag: "🇦�" },
  { code: "+995", country: "Georgia", flag: "��" },

  // Pacific Islands & Territories
  { code: "+678", country: "Vanuatu", flag: "��" },
  { code: "+685", country: "Samoa", flag: "🇼🇸" },
  { code: "+684", country: "American Samoa", flag: "��" },
  { code: "+676", country: "Tonga", flag: "🇹�" },
  { code: "+690", country: "Tokelau", flag: "��" },
  { code: "+687", country: "New Caledonia", flag: "��" },
  { code: "+689", country: "French Polynesia", flag: "��" },
  { code: "+683", country: "Niue", flag: "��" },
  { code: "+682", country: "Cook Islands", flag: "��" },
  { code: "+681", country: "Wallis and Futuna", flag: "🇫" },
  { code: "+680", country: "Palau", flag: "��" },
  { code: "+677", country: "Solomon Islands", flag: "��" },
  { code: "+675", country: "Papua New Guinea", flag: "��" },
  { code: "+674", country: "Nauru", flag: "🇷" },
  { code: "+673", country: "Brunei", flag: "��" },
  { code: "+670", country: "East Timor", flag: "��" },

  // French Territories
  { code: "+508", country: "Saint Pierre and Miquelon", flag: "🇲" },
  { code: "+590", country: "Guadeloupe", flag: "��" },
  { code: "+596", country: "Martinique", flag: "�🇶" },
  { code: "+599", country: "Caribbean Netherlands", flag: "🇧🇶" },

  // Other territories
  { code: "+297", country: "Aruba", flag: "🇦🇼" },
  { code: "+672", country: "Antarctica", flag: "🇦🇶" },
  { code: "+668", country: "Norfolk Island", flag: "��" },
  { code: "+667", country: "Christmas Island", flag: "🇨🇽" },
  { code: "+664", country: "Montserrat", flag: "��" }
];

// Helper function to find country by name and code
function findCountryMapping(countryName: string, countryCode: string) {
  // First try exact match by country name
  const exactMatch = countryMappings.find(
    mapping => mapping.country.toLowerCase() === countryName.toLowerCase() && 
               mapping.code === countryCode
  );
  
  if (exactMatch) return exactMatch;
  
  // Try partial match by country name
  const partialMatch = countryMappings.find(
    mapping => mapping.country.toLowerCase().includes(countryName.toLowerCase()) ||
               countryName.toLowerCase().includes(mapping.country.toLowerCase())
  );
  
  if (partialMatch) return partialMatch;
  
  // Try match by country code only (take first match)
  const codeMatch = countryMappings.find(mapping => mapping.code === countryCode);
  
  return codeMatch;
}

async function updateCountryFlags() {
  try {
    console.log("🏁 Starting country flag update process...");

    // First, let's see what countries we have in the database
    const existingRates = await prisma.callRate.findMany({
      select: {
        id: true,
        country: true,
        countryCode: true,
        flag: true
      }
    });

    console.log(`\n📊 Found ${existingRates.length} countries in database:`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const rate of existingRates) {
      // Skip if already has a flag
      if (rate.flag) {
        skippedCount++;
        continue;
      }

      // Try to find a matching flag using our helper function
      const flagMapping = findCountryMapping(rate.country, rate.countryCode);
      
      if (flagMapping) {
        try {
          const updated = await prisma.callRate.update({
            where: { id: rate.id },
            data: {
              flag: flagMapping.flag,
            }
          });
          
          console.log(`✅ Updated ${rate.country} (${rate.countryCode}) with flag ${flagMapping.flag}`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to update ${rate.country}:`, error);
        }
      } else {
        console.log(`⚠️  No flag found for ${rate.country} (${rate.countryCode})`);
      }
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Updated: ${updatedCount} countries`);
    console.log(`⏭️  Skipped (already had flags): ${skippedCount} countries`);
    console.log(`⚠️  Missing flags: ${existingRates.length - updatedCount - skippedCount} countries`);

    // Show updated countries with flags
    const countriesWithFlags = await prisma.callRate.findMany({
      where: { flag: { not: null } }
    });

    console.log(`\n🏳️ Countries with flags (${countriesWithFlags.length}):`);
    countriesWithFlags.forEach(country => {
      console.log(`${country.flag} ${country.country} (${country.countryCode})`);
    });

  } catch (error) {
    console.error("❌ Error updating country flags:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateCountryFlags();
}

export { updateCountryFlags, countryMappings, findCountryMapping };