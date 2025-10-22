import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping of ISO codes to dialing codes
const ISO_TO_DIALING_CODE: { [key: string]: string } = {
  // North America
  'US': '+1', 'CA': '+1', 'AS': '+1684', 'GU': '+1671', 'MP': '+1670', 'PR': '+1787',
  
  // Europe
  'GB': '+44', 'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34', 'NL': '+31', 'BE': '+32',
  'CH': '+41', 'AT': '+43', 'SE': '+46', 'NO': '+47', 'DK': '+45', 'FI': '+358', 'IE': '+353',
  'PT': '+351', 'GR': '+30', 'PL': '+48', 'CZ': '+420', 'SK': '+421', 'HU': '+36', 'RO': '+40',
  'BG': '+359', 'HR': '+385', 'SI': '+386', 'EE': '+372', 'LV': '+371', 'LT': '+370',
  'LU': '+352', 'MT': '+356', 'CY': '+357', 'IS': '+354', 'AD': '+376', 'MC': '+377',
  'SM': '+378', 'VA': '+379', 'LI': '+423', 'AX': '+358', 'FO': '+298', 'GL': '+299',
  
  // Asia
  'CN': '+86', 'JP': '+81', 'KR': '+82', 'IN': '+91', 'PK': '+92', 'BD': '+880', 'LK': '+94',
  'MM': '+95', 'TH': '+66', 'VN': '+84', 'KH': '+855', 'LA': '+856', 'MY': '+60', 'SG': '+65',
  'ID': '+62', 'PH': '+63', 'BN': '+673', 'TL': '+670', 'MN': '+976', 'KZ': '+7', 'KG': '+996',
  'TJ': '+992', 'TM': '+993', 'UZ': '+998', 'AF': '+93', 'IR': '+98', 'IQ': '+964', 'SY': '+963',
  'LB': '+961', 'JO': '+962', 'IL': '+972', 'PS': '+970', 'SA': '+966', 'YE': '+967', 'OM': '+968',
  'AE': '+971', 'QA': '+974', 'BH': '+973', 'KW': '+965', 'TR': '+90', 'GE': '+995', 'AM': '+374',
  'AZ': '+994', 'HK': '+852', 'MO': '+853', 'TW': '+886', 'NP': '+977', 'BT': '+975', 'MV': '+960',
  
  // Africa
  'EG': '+20', 'LY': '+218', 'SD': '+249', 'TN': '+216', 'DZ': '+213', 'MA': '+212', 'EH': '+212',
  'MR': '+222', 'ML': '+223', 'BF': '+226', 'NE': '+227', 'TD': '+235', 'NG': '+234', 'BJ': '+229',
  'TG': '+228', 'GH': '+233', 'CI': '+225', 'LR': '+231', 'SL': '+232', 'GN': '+224', 'GW': '+245',
  'GM': '+220', 'SN': '+221', 'CV': '+238', 'ZA': '+27', 'NA': '+264', 'BW': '+267', 'ZW': '+263',
  'ZM': '+260', 'MW': '+265', 'MZ': '+258', 'SZ': '+268', 'LS': '+266', 'MG': '+261', 'MU': '+230',
  'SC': '+248', 'KM': '+269', 'YT': '+262', 'RE': '+262', 'ET': '+251', 'ER': '+291', 'DJ': '+253',
  'SO': '+252', 'KE': '+254', 'UG': '+256', 'TZ': '+255', 'RW': '+250', 'BI': '+257', 'CD': '+243',
  'CG': '+242', 'CM': '+237', 'CF': '+236', 'GQ': '+240', 'GA': '+241', 'ST': '+239', 'AO': '+244',
  'SH': '+290', 'IO': '+246',
  
  // Oceania
  'AU': '+61', 'NZ': '+64', 'FJ': '+679', 'PG': '+675', 'SB': '+677', 'NC': '+687', 'VU': '+678',
  'WS': '+685', 'TO': '+676', 'TV': '+688', 'KI': '+686', 'NR': '+674', 'PW': '+680', 'FM': '+691',
  'MH': '+692', 'NU': '+683', 'CK': '+682', 'PF': '+689', 'WF': '+681', 'TK': '+690',
  
  // South America
  'BR': '+55', 'AR': '+54', 'CL': '+56', 'CO': '+57', 'VE': '+58', 'GY': '+592', 'SR': '+597',
  'UY': '+598', 'PY': '+595', 'BO': '+591', 'PE': '+51', 'EC': '+593', 'GF': '+594', 'FK': '+500',
  
  // Central America & Caribbean
  'MX': '+52', 'GT': '+502', 'BZ': '+501', 'SV': '+503', 'HN': '+504', 'NI': '+505', 'CR': '+506',
  'PA': '+507', 'CU': '+53', 'JM': '+1876', 'HT': '+509', 'DO': '+1809', 'TT': '+1868', 'BB': '+1246',
  'LC': '+1758', 'GD': '+1473', 'VC': '+1784', 'AG': '+1268', 'DM': '+1767', 'KN': '+1869',
  'BS': '+1242', 'BM': '+1441', 'TC': '+1649', 'KY': '+1345', 'VI': '+1340', 'AI': '+1264',
  'MS': '+1664', 'VG': '+1284', 'GP': '+590', 'MQ': '+596', 'BL': '+590', 'MF': '+590',
  'CW': '+599', 'AW': '+297', 'SX': '+1721', 'BQ': '+599',
  
  // Russia & CIS
  'RU': '+7', 'BY': '+375', 'UA': '+380', 'MD': '+373'
};

export async function GET() {
  try {
    // Get most popular countries dynamically by finding the most common/cheapest rates
    // Priority: Major countries with best rates and good connectivity
    const popularCountries = await prisma.callRate.findMany({
      where: {
        isActive: true,
        // Focus on major countries with reliable infrastructure
        OR: [
          { country: { contains: 'United States' } },
          { country: { contains: 'United Kingdom' } },
          { country: { contains: 'India' } },
          { country: { contains: 'Germany' } },
          { country: { contains: 'France' } },
          { country: { contains: 'Canada' } },
          { country: { contains: 'Australia' } },
          { country: { contains: 'Japan' } },
          { country: { contains: 'Netherlands' } },
          { country: { contains: 'Singapore' } },
          { country: { contains: 'Switzerland' } },
          { country: { contains: 'United Arab Emirates' } },
          { country: { contains: 'Brazil' } },
          { country: { contains: 'Mexico' } },
          { country: { contains: 'South Korea' } }
        ]
      },
      orderBy: [
        { rate: 'asc' }, // Show cheapest rates first
        { country: 'asc' } // Then alphabetically
      ],
      take: 10
    });

    // Format countries using data from database (including flags)
    const formattedCountries = popularCountries.map((country: any) => ({
      code: ISO_TO_DIALING_CODE[country.countryCode] || '+1', // Convert ISO to dialing code
      name: country.country,
      flag: country.flag || '🌍', // Use flag from database
      rate: country.rate,
      formattedRate: `from $${country.rate.toFixed(3)}/min`,
      currency: country.currency
    }));

    // If we somehow have no results, get the top 5 cheapest rates from any country
    let result = formattedCountries;
    if (formattedCountries.length === 0) {
      const fallbackCountries = await prisma.callRate.findMany({
        where: { isActive: true },
        orderBy: { rate: 'asc' },
        take: 5
      });
      
      result = fallbackCountries.map((country: any) => ({
        code: ISO_TO_DIALING_CODE[country.countryCode] || '+1', // Convert ISO to dialing code
        name: country.country,
        flag: country.flag || '🌍',
        rate: country.rate,
        formattedRate: `from $${country.rate.toFixed(3)}/min`,
        currency: country.currency
      }));
    }

    return NextResponse.json({
      success: true,
      data: result.slice(0, 5) // Return top 5 popular countries
    });
  } catch (error) {
    console.error("Error fetching popular countries:", error);
    
    // Only as absolute last resort, try to get any countries from database
    try {
      const emergencyCountries = await prisma.callRate.findMany({
        where: { isActive: true },
        orderBy: { rate: 'asc' },
        take: 5
      });
      
      if (emergencyCountries.length > 0) {
        return NextResponse.json({
          success: true,
          data: emergencyCountries.map((country: any) => ({
            code: ISO_TO_DIALING_CODE[country.countryCode] || '+1', // Convert ISO to dialing code
            name: country.country,
            flag: country.flag || '🌍',
            rate: country.rate,
            formattedRate: `from $${country.rate.toFixed(3)}/min`,
            currency: country.currency
          }))
        });
      }
    } catch (emergencyError) {
      console.error("Emergency fallback also failed:", emergencyError);
    }
    
    // Absolute last resort - return error
    return NextResponse.json({
      success: false,
      error: "Unable to fetch popular countries",
      data: []
    });
  }
}