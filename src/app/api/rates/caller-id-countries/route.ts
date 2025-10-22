import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    // Get the 4 unique caller ID countries and get their actual country flags
    const callerIdCountries = await prisma.$queryRaw<{callerIdCountry: string}[]>`
      SELECT DISTINCT callerIdCountry 
      FROM CallRate 
      WHERE callerIdCountry IS NOT NULL
      ORDER BY callerIdCountry
    `

    // Map each caller ID country to its proper flag - Complete mapping for all countries
    const callerIdFlags: { [key: string]: string } = {
      // North America
      'US': '🇺🇸', 'CA': '🇨🇦', 'AS': '🇦🇸', 'GU': '🇬🇺', 'MP': '🇲🇵', 'PR': '🇵🇷', 'VI': '🇻🇮',
      
      // Europe
      'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪',
      'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'IE': '🇮🇪',
      'PT': '🇵🇹', 'GR': '🇬🇷', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'SK': '🇸🇰', 'HU': '🇭🇺', 'RO': '🇷🇴',
      'BG': '🇧🇬', 'HR': '🇭🇷', 'SI': '🇸🇮', 'EE': '🇪🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'LU': '🇱🇺',
      'MT': '🇲🇹', 'CY': '🇨🇾', 'IS': '🇮🇸', 'AD': '🇦�', 'MC': '🇲🇨', 'SM': '🇸🇲', 'VA': '🇻🇦',
      'LI': '🇱�🇮', 'AX': '🇦🇽', 'FO': '🇫🇴', 'GL': '🇬�',
      
      // Asia
      'CN': '🇨🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'IN': '🇮🇳', 'PK': '🇵🇰', 'BD': '🇧�🇩', 'LK': '🇱🇰',
      'MM': '🇲🇲', 'TH': '🇹🇭', 'VN': '🇻🇳', 'KH': '🇰🇭', 'LA': '🇱🇦', 'MY': '🇲🇾', 'SG': '🇸🇬',
      'ID': '🇮🇩', 'PH': '🇵🇭', 'BN': '🇧🇳', 'TL': '🇹🇱', 'MN': '🇲🇳', 'KZ': '🇰🇿', 'KG': '🇰🇬',
      'TJ': '🇹🇯', 'TM': '🇹🇲', 'UZ': '🇺🇿', 'AF': '🇦🇫', 'IR': '🇮🇷', 'IQ': '🇮🇶', 'SY': '🇸🇾',
      'LB': '🇱🇧', 'JO': '🇯🇴', 'IL': '🇮🇱', 'PS': '🇵🇸', 'SA': '🇸🇦', 'YE': '🇾🇪', 'OM': '🇴🇲',
      'AE': '🇦🇪', 'QA': '🇶🇦', 'BH': '🇧🇭', 'KW': '🇰🇼', 'TR': '🇹🇷', 'GE': '🇬🇪', 'AM': '🇦🇲',
      'AZ': '🇦🇿', 'HK': '🇭🇰', 'MO': '🇲🇴', 'TW': '🇹🇼', 'NP': '🇳🇵', 'BT': '🇧🇹', 'MV': '🇲🇻',
      
      // Africa
      'EG': '🇪🇬', 'LY': '🇱🇾', 'SD': '🇸🇩', 'TN': '🇹🇳', 'DZ': '🇩🇿', 'MA': '🇲🇦', 'EH': '🇪🇭',
      'MR': '🇲🇷', 'ML': '🇲🇱', 'BF': '🇧🇫', 'NE': '🇳🇪', 'TD': '🇹🇩', 'NG': '🇳🇬', 'BJ': '🇧🇯',
      'TG': '🇹🇬', 'GH': '🇬🇭', 'CI': '🇨🇮', 'LR': '🇱🇷', 'SL': '🇸🇱', 'GN': '🇬🇳', 'GW': '🇬🇼',
      'GM': '🇬🇲', 'SN': '🇸🇳', 'CV': '🇨🇻', 'ZA': '🇿🇦', 'NA': '🇳🇦', 'BW': '🇧🇼', 'ZW': '🇿🇼',
      'ZM': '🇿🇲', 'MW': '🇲🇼', 'MZ': '🇲🇿', 'SZ': '🇸🇿', 'LS': '🇱🇸', 'MG': '🇲🇬', 'MU': '🇲🇺',
      'SC': '🇸🇨', 'KM': '🇰🇲', 'YT': '🇾🇹', 'RE': '🇷🇪', 'ET': '🇪🇹', 'ER': '🇪🇷', 'DJ': '🇩🇯',
      'SO': '🇸🇴', 'KE': '🇰🇪', 'UG': '🇺🇬', 'TZ': '🇹🇿', 'RW': '🇷🇼', 'BI': '🇧🇮', 'CD': '🇨🇩',
      'CG': '🇨🇬', 'CM': '🇨🇲', 'CF': '🇨🇫', 'GQ': '🇬🇶', 'GA': '🇬🇦', 'ST': '🇸🇹', 'AO': '🇦🇴',
      'SH': '🇸🇭', 'IO': '🇮🇴',
      
      // Oceania
      'AU': '🇦🇺', 'NZ': '🇳🇿', 'FJ': '🇫🇯', 'PG': '🇵🇬', 'SB': '🇸🇧', 'NC': '🇳🇨', 'VU': '🇻🇺',
      'WS': '🇼🇸', 'TO': '🇹🇴', 'TV': '🇹🇻', 'KI': '🇰🇮', 'NR': '🇳🇷', 'PW': '🇵🇼', 'FM': '🇫🇲',
      'MH': '🇲🇭', 'NU': '🇳🇺', 'CK': '🇨🇰', 'PF': '🇵🇫', 'WF': '🇼🇫', 'TK': '🇹🇰',
      
      // South America
      'BR': '🇧🇷', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'VE': '🇻🇪', 'GY': '🇬🇾', 'SR': '🇸🇷',
      'UY': '🇺🇾', 'PY': '🇵🇾', 'BO': '🇧🇴', 'PE': '🇵🇪', 'EC': '🇪🇨', 'GF': '🇬🇫', 'FK': '🇫🇰',
      
      // Central America & Caribbean
      'MX': '🇲🇽', 'GT': '🇬🇹', 'BZ': '🇧🇿', 'SV': '🇸🇻', 'HN': '🇭🇳', 'NI': '🇳🇮', 'CR': '🇨🇷',
      'PA': '🇵🇦', 'CU': '🇨🇺', 'JM': '🇯🇲', 'HT': '🇭🇹', 'DO': '🇩🇴', 'TT': '🇹🇹', 'BB': '🇧🇧',
      'LC': '🇱🇨', 'GD': '🇬🇩', 'VC': '🇻🇨', 'AG': '🇦🇬', 'DM': '🇩🇲', 'KN': '🇰🇳', 'BS': '🇧🇸',
      'BM': '🇧🇲', 'TC': '🇹🇨', 'KY': '🇰🇾', 'AI': '🇦🇮', 'MS': '🇲🇸', 'VG': '🇻🇬', 'GP': '🇬🇵',
      'MQ': '🇲🇶', 'BL': '🇧🇱', 'MF': '🇲🇫', 'CW': '🇨🇼', 'AW': '🇦🇼', 'SX': '🇸🇽', 'BQ': '🇧🇶',
      
      // Russia & CIS
      'RU': '🇷🇺', 'BY': '🇧🇾', 'UA': '🇺🇦', 'MD': '🇲🇩'
    }

    // Transform the data to match the expected format
    const formattedCountries = callerIdCountries
      .filter(rate => rate.callerIdCountry) // Filter out null values
      .map(rate => {
        // Map country codes to country names - Complete mapping for all countries
        const countryNames: { [key: string]: string } = {
          // North America
          'US': 'United States',
          'CA': 'Canada',
          'AS': 'American Samoa',
          'GU': 'Guam',
          'MP': 'Northern Mariana Islands',
          'PR': 'Puerto Rico',
          'VI': 'U.S. Virgin Islands',
          
          // Europe
          'GB': 'United Kingdom',
          'DE': 'Germany',
          'FR': 'France',
          'IT': 'Italy',
          'ES': 'Spain',
          'NL': 'Netherlands',
          'BE': 'Belgium',
          'CH': 'Switzerland',
          'AT': 'Austria',
          'SE': 'Sweden',
          'NO': 'Norway',
          'DK': 'Denmark',
          'FI': 'Finland',
          'IE': 'Ireland',
          'PT': 'Portugal',
          'GR': 'Greece',
          'PL': 'Poland',
          'CZ': 'Czech Republic',
          'SK': 'Slovakia',
          'HU': 'Hungary',
          'RO': 'Romania',
          'BG': 'Bulgaria',
          'HR': 'Croatia',
          'SI': 'Slovenia',
          'EE': 'Estonia',
          'LV': 'Latvia',
          'LT': 'Lithuania',
          'LU': 'Luxembourg',
          'MT': 'Malta',
          'CY': 'Cyprus',
          'IS': 'Iceland',
          'AD': 'Andorra',
          'MC': 'Monaco',
          'SM': 'San Marino',
          'VA': 'Vatican City',
          'LI': 'Liechtenstein',
          'AX': 'Åland Islands',
          'FO': 'Faroe Islands',
          'GL': 'Greenland',
          
          // Asia
          'CN': 'China',
          'JP': 'Japan',
          'KR': 'South Korea',
          'IN': 'India',
          'PK': 'Pakistan',
          'BD': 'Bangladesh',
          'LK': 'Sri Lanka',
          'MM': 'Myanmar',
          'TH': 'Thailand',
          'VN': 'Vietnam',
          'KH': 'Cambodia',
          'LA': 'Laos',
          'MY': 'Malaysia',
          'SG': 'Singapore',
          'ID': 'Indonesia',
          'PH': 'Philippines',
          'BN': 'Brunei',
          'TL': 'East Timor',
          'MN': 'Mongolia',
          'KZ': 'Kazakhstan',
          'KG': 'Kyrgyzstan',
          'TJ': 'Tajikistan',
          'TM': 'Turkmenistan',
          'UZ': 'Uzbekistan',
          'AF': 'Afghanistan',
          'IR': 'Iran',
          'IQ': 'Iraq',
          'SY': 'Syria',
          'LB': 'Lebanon',
          'JO': 'Jordan',
          'IL': 'Israel',
          'PS': 'Palestine',
          'SA': 'Saudi Arabia',
          'YE': 'Yemen',
          'OM': 'Oman',
          'AE': 'United Arab Emirates',
          'QA': 'Qatar',
          'BH': 'Bahrain',
          'KW': 'Kuwait',
          'TR': 'Turkey',
          'GE': 'Georgia',
          'AM': 'Armenia',
          'AZ': 'Azerbaijan',
          'HK': 'Hong Kong',
          'MO': 'Macau',
          'TW': 'Taiwan',
          'NP': 'Nepal',
          'BT': 'Bhutan',
          'MV': 'Maldives',
          
          // Africa
          'EG': 'Egypt',
          'LY': 'Libya',
          'SD': 'Sudan',
          'TN': 'Tunisia',
          'DZ': 'Algeria',
          'MA': 'Morocco',
          'EH': 'Western Sahara',
          'MR': 'Mauritania',
          'ML': 'Mali',
          'BF': 'Burkina Faso',
          'NE': 'Niger',
          'TD': 'Chad',
          'NG': 'Nigeria',
          'BJ': 'Benin',
          'TG': 'Togo',
          'GH': 'Ghana',
          'CI': 'Côte d\'Ivoire',
          'LR': 'Liberia',
          'SL': 'Sierra Leone',
          'GN': 'Guinea',
          'GW': 'Guinea-Bissau',
          'GM': 'Gambia',
          'SN': 'Senegal',
          'CV': 'Cape Verde',
          'ZA': 'South Africa',
          'NA': 'Namibia',
          'BW': 'Botswana',
          'ZW': 'Zimbabwe',
          'ZM': 'Zambia',
          'MW': 'Malawi',
          'MZ': 'Mozambique',
          'SZ': 'Eswatini',
          'LS': 'Lesotho',
          'MG': 'Madagascar',
          'MU': 'Mauritius',
          'SC': 'Seychelles',
          'KM': 'Comoros',
          'YT': 'Mayotte',
          'RE': 'Réunion',
          'ET': 'Ethiopia',
          'ER': 'Eritrea',
          'DJ': 'Djibouti',
          'SO': 'Somalia',
          'KE': 'Kenya',
          'UG': 'Uganda',
          'TZ': 'Tanzania',
          'RW': 'Rwanda',
          'BI': 'Burundi',
          'CD': 'Democratic Republic of the Congo',
          'CG': 'Republic of the Congo',
          'CM': 'Cameroon',
          'CF': 'Central African Republic',
          'GQ': 'Equatorial Guinea',
          'GA': 'Gabon',
          'ST': 'São Tomé and Príncipe',
          'AO': 'Angola',
          'SH': 'Saint Helena',
          'IO': 'British Indian Ocean Territory',
          
          // Oceania
          'AU': 'Australia',
          'NZ': 'New Zealand',
          'FJ': 'Fiji',
          'PG': 'Papua New Guinea',
          'SB': 'Solomon Islands',
          'NC': 'New Caledonia',
          'VU': 'Vanuatu',
          'WS': 'Samoa',
          'TO': 'Tonga',
          'TV': 'Tuvalu',
          'KI': 'Kiribati',
          'NR': 'Nauru',
          'PW': 'Palau',
          'FM': 'Micronesia',
          'MH': 'Marshall Islands',
          'NU': 'Niue',
          'CK': 'Cook Islands',
          'PF': 'French Polynesia',
          'WF': 'Wallis and Futuna',
          'TK': 'Tokelau',
          
          // South America
          'BR': 'Brazil',
          'AR': 'Argentina',
          'CL': 'Chile',
          'CO': 'Colombia',
          'VE': 'Venezuela',
          'GY': 'Guyana',
          'SR': 'Suriname',
          'UY': 'Uruguay',
          'PY': 'Paraguay',
          'BO': 'Bolivia',
          'PE': 'Peru',
          'EC': 'Ecuador',
          'GF': 'French Guiana',
          'FK': 'Falkland Islands',
          
          // Central America & Caribbean
          'MX': 'Mexico',
          'GT': 'Guatemala',
          'BZ': 'Belize',
          'SV': 'El Salvador',
          'HN': 'Honduras',
          'NI': 'Nicaragua',
          'CR': 'Costa Rica',
          'PA': 'Panama',
          'CU': 'Cuba',
          'JM': 'Jamaica',
          'HT': 'Haiti',
          'DO': 'Dominican Republic',
          'TT': 'Trinidad and Tobago',
          'BB': 'Barbados',
          'LC': 'Saint Lucia',
          'GD': 'Grenada',
          'VC': 'Saint Vincent and the Grenadines',
          'AG': 'Antigua and Barbuda',
          'DM': 'Dominica',
          'KN': 'Saint Kitts and Nevis',
          'BS': 'Bahamas',
          'BM': 'Bermuda',
          'TC': 'Turks and Caicos Islands',
          'KY': 'Cayman Islands',
          'AI': 'Anguilla',
          'MS': 'Montserrat',
          'VG': 'British Virgin Islands',
          'GP': 'Guadeloupe',
          'MQ': 'Martinique',
          'BL': 'Saint Barthélemy',
          'MF': 'Saint Martin',
          'CW': 'Curaçao',
          'AW': 'Aruba',
          'SX': 'Sint Maarten',
          'BQ': 'Caribbean Netherlands',
          
          // Russia & CIS
          'RU': 'Russia',
          'BY': 'Belarus',
          'UA': 'Ukraine',
          'MD': 'Moldova'
        }

        return {
          code: ISO_TO_DIALING_CODE[rate.callerIdCountry] || '+1', // Convert ISO to dialing code
          name: countryNames[rate.callerIdCountry] || rate.callerIdCountry,
          flag: callerIdFlags[rate.callerIdCountry] || '🌍'
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name

    return NextResponse.json(formattedCountries)
  } catch (error) {
    console.error('Error fetching caller ID countries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch caller ID countries' },
      { status: 500 }
    )
  }
}