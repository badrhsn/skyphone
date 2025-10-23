"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Plus,
  History,
  Contact,
  CreditCard,
  MessageCircle,
  Clock,
  DollarSign,
  Globe
} from "lucide-react";
import { useModal } from "@/components/Modal";

interface CallRate {
  id: string;
  country: string;
  countryCode: string;
  rate: number;
  currency: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  isAdmin: boolean;
}

// Mapping of international dialing codes to ISO country codes
const DIALING_CODE_TO_ISO: { [key: string]: string } = {
  '+1': 'US',      // United States/Canada
  '+44': 'GB',     // United Kingdom
  '+33': 'FR',     // France
  '+49': 'DE',     // Germany
  '+212': 'MA',    // Morocco
  '+213': 'DZ',    // Algeria
  '+216': 'TN',    // Tunisia
  '+218': 'LY',    // Libya
  '+220': 'GM',    // Gambia
  '+221': 'SN',    // Senegal
  '+222': 'MR',    // Mauritania
  '+223': 'ML',    // Mali
  '+224': 'GN',    // Guinea
  '+225': 'CI',    // Côte d'Ivoire
  '+226': 'BF',    // Burkina Faso
  '+227': 'NE',    // Niger
  '+228': 'TG',    // Togo
  '+229': 'BJ',    // Benin
  '+230': 'MU',    // Mauritius
  '+231': 'LR',    // Liberia
  '+232': 'SL',    // Sierra Leone
  '+233': 'GH',    // Ghana
  '+234': 'NG',    // Nigeria
  '+235': 'TD',    // Chad
  '+236': 'CF',    // Central African Republic
  '+237': 'CM',    // Cameroon
  '+238': 'CV',    // Cape Verde
  '+239': 'ST',    // São Tomé and Príncipe
  '+240': 'GQ',    // Equatorial Guinea
  '+241': 'GA',    // Gabon
  '+242': 'CG',    // Republic of the Congo
  '+243': 'CD',    // Democratic Republic of the Congo
  '+244': 'AO',    // Angola
  '+245': 'GW',    // Guinea-Bissau
  '+248': 'SC',    // Seychelles
  '+249': 'SD',    // Sudan
  '+250': 'RW',    // Rwanda
  '+251': 'ET',    // Ethiopia
  '+252': 'SO',    // Somalia
  '+253': 'DJ',    // Djibouti
  '+254': 'KE',    // Kenya
  '+255': 'TZ',    // Tanzania
  '+256': 'UG',    // Uganda
  '+257': 'BI',    // Burundi
  '+258': 'MZ',    // Mozambique
  '+260': 'ZM',    // Zambia
  '+261': 'MG',    // Madagascar
  '+262': 'RE',    // Réunion
  '+263': 'ZW',    // Zimbabwe
  '+264': 'NA',    // Namibia
  '+265': 'MW',    // Malawi
  '+266': 'LS',    // Lesotho
  '+267': 'BW',    // Botswana
  '+268': 'SZ',    // Eswatini
  '+269': 'KM',    // Comoros
  '+290': 'SH',    // Saint Helena
  '+291': 'ER',    // Eritrea
  '+297': 'AW',    // Aruba
  '+298': 'FO',    // Faroe Islands
  '+299': 'GL',    // Greenland
  '+350': 'GI',    // Gibraltar
  '+351': 'PT',    // Portugal
  '+352': 'LU',    // Luxembourg
  '+353': 'IE',    // Ireland
  '+354': 'IS',    // Iceland
  '+355': 'AL',    // Albania
  '+356': 'MT',    // Malta
  '+357': 'CY',    // Cyprus
  '+358': 'FI',    // Finland
  '+359': 'BG',    // Bulgaria
  '+370': 'LT',    // Lithuania
  '+371': 'LV',    // Latvia
  '+372': 'EE',    // Estonia
  '+373': 'MD',    // Moldova
  '+374': 'AM',    // Armenia
  '+375': 'BY',    // Belarus
  '+376': 'AD',    // Andorra
  '+377': 'MC',    // Monaco
  '+378': 'SM',    // San Marino
  '+380': 'UA',    // Ukraine
  '+381': 'RS',    // Serbia
  '+382': 'ME',    // Montenegro
  '+383': 'XK',    // Kosovo
  '+385': 'HR',    // Croatia
  '+386': 'SI',    // Slovenia
  '+387': 'BA',    // Bosnia and Herzegovina
  '+389': 'MK',    // North Macedonia
  '+420': 'CZ',    // Czech Republic
  '+421': 'SK',    // Slovakia
  '+423': 'LI',    // Liechtenstein
  '+43': 'AT',     // Austria
  '+45': 'DK',     // Denmark
  '+46': 'SE',     // Sweden
  '+47': 'NO',     // Norway
  '+48': 'PL',     // Poland
  '+39': 'IT',     // Italy
  '+41': 'CH',     // Switzerland
  '+31': 'NL',     // Netherlands
  '+32': 'BE',     // Belgium
  '+34': 'ES',     // Spain
  '+36': 'HU',     // Hungary
  '+40': 'RO',     // Romania
  '+7': 'RU',      // Russia
  '+86': 'CN',     // China
  '+81': 'JP',     // Japan
  '+82': 'KR',     // South Korea
  '+91': 'IN',     // India
  '+92': 'PK',     // Pakistan
  '+93': 'AF',     // Afghanistan
  '+94': 'LK',     // Sri Lanka
  '+95': 'MM',     // Myanmar
  '+98': 'IR',     // Iran
  '+20': 'EG',     // Egypt
  '+27': 'ZA',     // South Africa
  '+30': 'GR',     // Greece
  '+90': 'TR',     // Turkey
  '+52': 'MX',     // Mexico
  '+55': 'BR',     // Brazil
  '+54': 'AR',     // Argentina
  '+56': 'CL',     // Chile
  '+57': 'CO',     // Colombia
  '+58': 'VE',     // Venezuela
  '+51': 'PE',     // Peru
  '+595': 'PY',    // Paraguay
  '+598': 'UY',    // Uruguay
  '+591': 'BO',    // Bolivia
  '+593': 'EC',    // Ecuador
  '+594': 'GF',    // French Guiana
  '+596': 'MQ',    // Martinique
  '+597': 'SR',    // Suriname
  '+590': 'GP',    // Guadeloupe
  '+60': 'MY',     // Malaysia
  '+62': 'ID',     // Indonesia
  '+63': 'PH',     // Philippines
  '+64': 'NZ',     // New Zealand
  '+65': 'SG',     // Singapore
  '+66': 'TH',     // Thailand
  '+84': 'VN',     // Vietnam
  '+852': 'HK',    // Hong Kong
  '+853': 'MO',    // Macau
  '+886': 'TW',    // Taiwan
  '+61': 'AU',     // Australia
  '+971': 'AE',    // United Arab Emirates
  '+966': 'SA',    // Saudi Arabia
  '+974': 'QA',    // Qatar
  '+965': 'KW',    // Kuwait
  '+968': 'OM',    // Oman
  '+973': 'BH',    // Bahrain
  '+972': 'IL',    // Israel
  '+962': 'JO',    // Jordan
  '+961': 'LB',    // Lebanon
  '+963': 'SY',    // Syria
  '+964': 'IQ',    // Iraq
  '+967': 'YE',    // Yemen
  '+1684': 'AS',   // American Samoa
  '+1264': 'AI',   // Anguilla
  '+1268': 'AG',   // Antigua and Barbuda
  '+1242': 'BS',   // Bahamas
  '+1246': 'BB',   // Barbados
  '+1441': 'BM',   // Bermuda
  '+1284': 'VG',   // British Virgin Islands
  '+1345': 'KY',   // Cayman Islands
  '+1767': 'DM',   // Dominica
  '+1809': 'DO',   // Dominican Republic
  '+1473': 'GD',   // Grenada
  '+1876': 'JM',   // Jamaica
  '+1664': 'MS',   // Montserrat
  '+1869': 'KN',   // Saint Kitts and Nevis
  '+1758': 'LC',   // Saint Lucia
  '+1784': 'VC',   // Saint Vincent and the Grenadines
  '+1721': 'SX',   // Sint Maarten
  '+1649': 'TC',   // Turks and Caicos Islands
  '+1868': 'TT',   // Trinidad and Tobago
  '+1340': 'VI',   // U.S. Virgin Islands
  '+855': 'KH',    // Cambodia
  '+237': 'CM',    // Cameroon
  '+238': 'CV',    // Cape Verde
  '+1': 'CA',      // Canada (also uses +1 like US)
  '+225': 'CI',    // Côte d'Ivoire
  '+506': 'CR',    // Costa Rica
  '+53': 'CU',     // Cuba
  '+357': 'CY',    // Cyprus
  '+420': 'CZ',    // Czech Republic
  '+45': 'DK',     // Denmark
  '+253': 'DJ',    // Djibouti
  '+593': 'EC',    // Ecuador
  '+20': 'EG',     // Egypt
  '+291': 'ER',    // Eritrea
  '+372': 'EE',    // Estonia
  '+251': 'ET',    // Ethiopia
  '+679': 'FJ',    // Fiji
  '+358': 'FI',    // Finland
  '+594': 'GF',    // French Guiana
  '+241': 'GA',    // Gabon
  '+220': 'GM',    // Gambia
  '+995': 'GE',    // Georgia
  '+233': 'GH',    // Ghana
  '+30': 'GR',     // Greece
  '+590': 'GP',    // Guadeloupe
  '+502': 'GT',    // Guatemala
  '+224': 'GN',    // Guinea
  '+245': 'GW',    // Guinea-Bissau
  '+592': 'GY',    // Guyana
  '+509': 'HT',    // Haiti
  '+504': 'HN',    // Honduras
  '+36': 'HU',     // Hungary
  '+354': 'IS',    // Iceland
  '+353': 'IE',    // Ireland
  '+964': 'IQ',    // Iraq
  '+81': 'JP',     // Japan
  '+962': 'JO',    // Jordan
  '+7': 'KZ',      // Kazakhstan
  '+254': 'KE',    // Kenya
  '+686': 'KI',    // Kiribati
  '+82': 'KR',     // South Korea
  '+965': 'KW',    // Kuwait
  '+996': 'KG',    // Kyrgyzstan
  '+856': 'LA',    // Laos
  '+371': 'LV',    // Latvia
  '+961': 'LB',    // Lebanon
  '+266': 'LS',    // Lesotho
  '+231': 'LR',    // Liberia
  '+218': 'LY',    // Libya
  '+423': 'LI',    // Liechtenstein
  '+370': 'LT',    // Lithuania
  '+352': 'LU',    // Luxembourg
  '+853': 'MO',    // Macau
  '+261': 'MG',    // Madagascar
  '+265': 'MW',    // Malawi
  '+960': 'MV',    // Maldives
  '+223': 'ML',    // Mali
  '+356': 'MT',    // Malta
  '+692': 'MH',    // Marshall Islands
  '+596': 'MQ',    // Martinique
  '+222': 'MR',    // Mauritania
  '+230': 'MU',    // Mauritius
  '+262': 'YT',    // Mayotte
  '+52': 'MX',     // Mexico
  '+691': 'FM',    // Micronesia
  '+373': 'MD',    // Moldova
  '+377': 'MC',    // Monaco
  '+976': 'MN',    // Mongolia
  '+382': 'ME',    // Montenegro
  '+258': 'MZ',    // Mozambique
  '+95': 'MM',     // Myanmar (Burma)
  '+264': 'NA',    // Namibia
  '+977': 'NP',    // Nepal
  '+31': 'NL',     // Netherlands
  '+687': 'NC',    // New Caledonia
  '+64': 'NZ',     // New Zealand
  '+505': 'NI',    // Nicaragua
  '+227': 'NE',    // Niger
  '+234': 'NG',    // Nigeria
  '+672': 'NF',    // Norfolk Island
  '+389': 'MK',    // North Macedonia
  '+1670': 'MP',   // Northern Mariana Islands
  '+47': 'NO',     // Norway
  '+968': 'OM',    // Oman
  '+92': 'PK',     // Pakistan
  '+680': 'PW',    // Palau
  '+970': 'PS',    // Palestine
  '+507': 'PA',    // Panama
  '+675': 'PG',    // Papua New Guinea
  '+595': 'PY',    // Paraguay
  '+51': 'PE',     // Peru
  '+63': 'PH',     // Philippines
  '+48': 'PL',     // Poland
  '+351': 'PT',    // Portugal
  '+1': 'PR',      // Puerto Rico
  '+974': 'QA',    // Qatar
  '+242': 'CG',    // Republic of the Congo
  '+262': 'RE',    // Reunion
  '+40': 'RO',     // Romania
  '+7': 'RU',      // Russia
  '+250': 'RW',    // Rwanda
  '+590': 'BL',    // Saint Barthelemy
  '+508': 'PM',    // Saint Pierre and Miquelon
  '+590': 'MF',    // Saint Martin
  '+685': 'WS',    // Samoa
  '+378': 'SM',    // San Marino
  '+966': 'SA',    // Saudi Arabia
  '+221': 'SN',    // Senegal
  '+381': 'RS',    // Serbia
  '+248': 'SC',    // Seychelles
  '+232': 'SL',    // Sierra Leone
  '+65': 'SG',     // Singapore
  '+421': 'SK',    // Slovakia
  '+386': 'SI',    // Slovenia
  '+677': 'SB',    // Solomon Islands
  '+252': 'SO',    // Somalia
  '+27': 'ZA',     // South Africa
  '+211': 'SS',    // South Sudan
  '+34': 'ES',     // Spain
  '+94': 'LK',     // Sri Lanka
  '+249': 'SD',    // Sudan
  '+597': 'SR',    // Suriname
  '+47': 'SJ',     // Svalbard and Jan Mayen
  '+46': 'SE',     // Sweden
  '+41': 'CH',     // Switzerland
  '+963': 'SY',    // Syria
  '+886': 'TW',    // Taiwan
  '+992': 'TJ',    // Tajikistan
  '+255': 'TZ',    // Tanzania
  '+66': 'TH',     // Thailand
  '+228': 'TG',    // Togo
  '+676': 'TO',    // Tonga
  '+216': 'TN',    // Tunisia
  '+90': 'TR',     // Turkey
  '+993': 'TM',    // Turkmenistan
  '+256': 'UG',    // Uganda
  '+380': 'UA',    // Ukraine
  '+971': 'AE',    // United Arab Emirates
  '+44': 'GB',     // United Kingdom
  '+598': 'UY',    // Uruguay
  '+998': 'UZ',    // Uzbekistan
  '+678': 'VU',    // Vanuatu
  '+39': 'VA',     // Vatican City
  '+58': 'VE',     // Venezuela
  '+84': 'VN',     // Vietnam
  '+681': 'WF',    // Wallis and Futuna
  '+212': 'EH',    // Western Sahara
  '+967': 'YE',    // Yemen
  '+260': 'ZM',    // Zambia
  '+263': 'ZW',    // Zimbabwe
  '+93': 'AF',     // Afghanistan
  '+358': 'AX',    // Aland (same as Finland)
  '+355': 'AL',    // Albania
  '+213': 'DZ',    // Algeria
  '+1684': 'AS',   // American Samoa
  '+376': 'AD',    // Andorra
  '+244': 'AO',    // Angola
  '+54': 'AR',     // Argentina
  '+374': 'AM',    // Armenia
  '+297': 'AW',    // Aruba
  '+994': 'AZ',    // Azerbaijan
  '+1242': 'BS',   // Bahamas
  '+973': 'BH',    // Bahrain
  '+880': 'BD',    // Bangladesh
  '+375': 'BY',    // Belarus
  '+32': 'BE',     // Belgium
  '+501': 'BZ',    // Belize
  '+229': 'BJ',    // Benin
  '+975': 'BT',    // Bhutan
  '+591': 'BO',    // Bolivia
  '+599': 'BQ',    // Bonaire
  '+387': 'BA',    // Bosnia and Herzegovina
  '+267': 'BW',    // Botswana
  '+55': 'BR',     // Brazil
  '+246': 'IO',    // British Indian Ocean Territory
  '+673': 'BN',    // Brunei
  '+359': 'BG',    // Bulgaria
  '+226': 'BF',    // Burkina Faso
  '+257': 'BI',    // Burundi
  '+236': 'CF',    // Central African Republic
  '+235': 'TD',    // Chad
  '+56': 'CL',     // Chile
  '+61': 'CX',     // Christmas Island
  '+61': 'CC',     // Cocos (Keeling) Islands
  '+57': 'CO',     // Colombia
  '+269': 'KM',    // Comoros
  '+682': 'CK',    // Cook Islands
  '+385': 'HR',    // Croatia
  '+599': 'CW',    // Curacao
  '+243': 'CD',    // Democratic Republic of the Congo
  '+670': 'TL',    // East Timor
  '+503': 'SV',    // El Salvador
  '+240': 'GQ',    // Equatorial Guinea
  '+268': 'SZ',    // Eswatini
  '+500': 'FK',    // Falkland Islands
  '+298': 'FO',    // Faroe Islands
  '+689': 'PF',    // French Polynesia
  '+350': 'GI',    // Gibraltar
  '+299': 'GL',    // Greenland
  '+1671': 'GU',   // Guam
  '+44': 'GG',     // Guernsey (same as UK)
  '+852': 'HK',    // Hong Kong
  '+91': 'IN',     // India
  '+62': 'ID',     // Indonesia
  '+972': 'IL',    // Israel
  '+44': 'IM',     // Isle of Man (same as UK)
  '+44': 'JE',     // Jersey (same as UK)
  '+383': 'XK',    // Kosovo
  '+60': 'MY',     // Malaysia
  '+212': 'MA',    // Morocco (note: conflicts with Western Sahara)
};

// Function to detect country from international dialing code
const detectCountryFromDialingCode = (phoneNumber: string): string | null => {
  console.log('🔍 Detecting country for phone number:', phoneNumber);
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  console.log('🧹 Clean number:', cleanNumber);
  
  // Check for longest matching dialing codes first
  const sortedCodes = Object.keys(DIALING_CODE_TO_ISO).sort((a, b) => 
    b.replace('+', '').length - a.replace('+', '').length
  );
  console.log('📋 Sorted dialing codes:', sortedCodes);
  
  for (const dialingCode of sortedCodes) {
    const codeDigits = dialingCode.replace('+', '');
    console.log(`🔄 Checking code ${dialingCode} (digits: ${codeDigits}) against ${cleanNumber}`);
    if (cleanNumber.startsWith(codeDigits)) {
      const isoCode = DIALING_CODE_TO_ISO[dialingCode];
      console.log('✅ MATCH FOUND! Returning ISO code:', isoCode);
      return isoCode;
    }
  }
  
  console.log('❌ No match found, returning null');
  return null;
};

// Special cases for countries that share dialing codes or have special handling
const ISO_TO_DIALING_CODE_SPECIAL: { [key: string]: string } = {
  'AX': '+358', // Aland Islands use Finland's dialing code
  'RE': '+262', // Reunion uses this code
  'YT': '+262', // Mayotte uses this code
  'GP': '+590', // Guadeloupe 
  'BL': '+590', // Saint Barthélemy
  'MF': '+590', // Saint Martin
  'PF': '+689', // French Polynesia
  'NC': '+687', // New Caledonia
  'WF': '+681', // Wallis and Futuna
  'AS': '+1684', // American Samoa
  'AI': '+1264', // Anguilla
  'AG': '+1268', // Antigua and Barbuda
  'BS': '+1242', // Bahamas
  'BB': '+1246', // Barbados
  'BM': '+1441', // Bermuda
  'VG': '+1284', // British Virgin Islands
  'KY': '+1345', // Cayman Islands
  'DM': '+1767', // Dominica
  'DO': '+1809', // Dominican Republic
  'GD': '+1473', // Grenada
  'JM': '+1876', // Jamaica
  'MS': '+1664', // Montserrat
  'KN': '+1869', // Saint Kitts and Nevis
  'LC': '+1758', // Saint Lucia
  'VC': '+1784', // Saint Vincent and the Grenadines
  'SX': '+1721', // Sint Maarten
  'TC': '+1649', // Turks and Caicos Islands
  'TT': '+1868', // Trinidad and Tobago
  'VI': '+1340', // U.S. Virgin Islands
  'KH': '+855',  // Cambodia
  'CM': '+237',  // Cameroon
  'CV': '+238',  // Cape Verde
  'CA': '+1',    // Canada (shares +1 with US)
  'CI': '+225',  // Côte d'Ivoire
  'CR': '+506',  // Costa Rica
  'CU': '+53',   // Cuba
  'CY': '+357',  // Cyprus
  'CZ': '+420',  // Czech Republic
  'DK': '+45',   // Denmark
  'DJ': '+253',  // Djibouti
  'EC': '+593',  // Ecuador
  'EG': '+20',   // Egypt
  'ER': '+291',  // Eritrea
  'EE': '+372',  // Estonia
  'ET': '+251',  // Ethiopia
  'FJ': '+679',  // Fiji
  'FI': '+358',  // Finland
  'GF': '+594',  // French Guiana
  'GA': '+241',  // Gabon
  'GM': '+220',  // Gambia
  'GE': '+995',  // Georgia
  'GH': '+233',  // Ghana
  'GR': '+30',   // Greece
  'GP': '+590',  // Guadeloupe
  'GT': '+502',  // Guatemala
  'GN': '+224',  // Guinea
  'GW': '+245',  // Guinea-Bissau
  'GY': '+592',  // Guyana
  'HT': '+509',  // Haiti
  'HN': '+504',  // Honduras
  'HU': '+36',   // Hungary
  'IS': '+354',  // Iceland
  'IE': '+353',  // Ireland
  'IQ': '+964',  // Iraq
  'JP': '+81',   // Japan
  'JO': '+962',  // Jordan
  'KZ': '+7',    // Kazakhstan
  'KE': '+254',  // Kenya
  'KI': '+686',  // Kiribati
  'KR': '+82',   // South Korea
  'KW': '+965',  // Kuwait
  'KG': '+996',  // Kyrgyzstan
  'LA': '+856',  // Laos
  'LV': '+371',  // Latvia
  'LB': '+961',  // Lebanon
  'LS': '+266',  // Lesotho
  'LR': '+231',  // Liberia
  'LY': '+218',  // Libya
  'LI': '+423',  // Liechtenstein
  'LT': '+370',  // Lithuania
  'LU': '+352',  // Luxembourg
  'MO': '+853',  // Macau
  'MG': '+261',  // Madagascar
  'MW': '+265',  // Malawi
  'MV': '+960',  // Maldives
  'ML': '+223',  // Mali
  'MT': '+356',  // Malta
  'MH': '+692',  // Marshall Islands
  'MQ': '+596',  // Martinique
  'MR': '+222',  // Mauritania
  'MU': '+230',  // Mauritius
  'YT': '+262',  // Mayotte
  'MX': '+52',   // Mexico
  'FM': '+691',  // Micronesia
  'MD': '+373',  // Moldova
  'MC': '+377',  // Monaco
  'MN': '+976',  // Mongolia
  'ME': '+382',  // Montenegro
  'MZ': '+258',  // Mozambique
  'MM': '+95',   // Myanmar (Burma)
  'NA': '+264',  // Namibia
  'NP': '+977',  // Nepal
  'NL': '+31',   // Netherlands
  'NC': '+687',  // New Caledonia
  'NZ': '+64',   // New Zealand
  'NI': '+505',  // Nicaragua
  'NE': '+227',  // Niger
  'NG': '+234',  // Nigeria
  'NF': '+672',  // Norfolk Island
  'MK': '+389',  // North Macedonia
  'MP': '+1670', // Northern Mariana Islands
  'NO': '+47',   // Norway
  'OM': '+968',  // Oman
  'PK': '+92',   // Pakistan
  'PW': '+680',  // Palau
  'PS': '+970',  // Palestine
  'PA': '+507',  // Panama
  'PG': '+675',  // Papua New Guinea
  'PY': '+595',  // Paraguay
  'PE': '+51',   // Peru
  'PH': '+63',   // Philippines
  'PL': '+48',   // Poland
  'PT': '+351',  // Portugal
  'PR': '+1',    // Puerto Rico
  'QA': '+974',  // Qatar
  'CG': '+242',  // Republic of the Congo
  'RE': '+262',  // Reunion
  'RO': '+40',   // Romania
  'RU': '+7',    // Russia
  'RW': '+250',  // Rwanda
  'BL': '+590',  // Saint Barthelemy
  'PM': '+508',  // Saint Pierre and Miquelon
  'MF': '+590',  // Saint Martin
  'WS': '+685',  // Samoa
  'SM': '+378',  // San Marino
  'SA': '+966',  // Saudi Arabia
  'SN': '+221',  // Senegal
  'RS': '+381',  // Serbia
  'SC': '+248',  // Seychelles
  'SL': '+232',  // Sierra Leone
  'SG': '+65',   // Singapore
  'SK': '+421',  // Slovakia
  'SI': '+386',  // Slovenia
  'SB': '+677',  // Solomon Islands
  'SO': '+252',  // Somalia
  'ZA': '+27',   // South Africa
  'SS': '+211',  // South Sudan
  'ES': '+34',   // Spain
  'LK': '+94',   // Sri Lanka
  'SD': '+249',  // Sudan
  'SR': '+597',  // Suriname
  'SJ': '+47',   // Svalbard and Jan Mayen
  'SE': '+46',   // Sweden
  'CH': '+41',   // Switzerland
  'SY': '+963',  // Syria
  'TW': '+886',  // Taiwan
  'TJ': '+992',  // Tajikistan
  'TZ': '+255',  // Tanzania
  'TH': '+66',   // Thailand
  'TG': '+228',  // Togo
  'TO': '+676',  // Tonga
  'TN': '+216',  // Tunisia
  'TR': '+90',   // Turkey
  'TM': '+993',  // Turkmenistan
  'UG': '+256',  // Uganda
  'UA': '+380',  // Ukraine
  'AE': '+971',  // United Arab Emirates
  'GB': '+44',   // United Kingdom
  'UY': '+598',  // Uruguay
  'UZ': '+998',  // Uzbekistan
  'VU': '+678',  // Vanuatu
  'VA': '+39',   // Vatican City
  'VE': '+58',   // Venezuela
  'VN': '+84',   // Vietnam
  'WF': '+681',  // Wallis and Futuna
  'EH': '+212',  // Western Sahara
  'YE': '+967',  // Yemen
  'ZM': '+260',  // Zambia
  'ZW': '+263',  // Zimbabwe
  'AF': '+93',   // Afghanistan
  'AX': '+358',  // Aland (same as Finland)
  'AL': '+355',  // Albania
  'DZ': '+213',  // Algeria
  'AS': '+1684', // American Samoa
  'AD': '+376',  // Andorra
  'AO': '+244',  // Angola
  'AR': '+54',   // Argentina
  'AM': '+374',  // Armenia
  'AW': '+297',  // Aruba
  'AZ': '+994',  // Azerbaijan
  'BS': '+1242', // Bahamas
  'BH': '+973',  // Bahrain
  'BD': '+880',  // Bangladesh
  'BY': '+375',  // Belarus
  'BE': '+32',   // Belgium
  'BZ': '+501',  // Belize
  'BJ': '+229',  // Benin
  'BT': '+975',  // Bhutan
  'BO': '+591',  // Bolivia
  'BQ': '+599',  // Bonaire
  'BA': '+387',  // Bosnia and Herzegovina
  'BW': '+267',  // Botswana
  'BR': '+55',   // Brazil
  'IO': '+246',  // British Indian Ocean Territory
  'BN': '+673',  // Brunei
  'BG': '+359',  // Bulgaria
  'BF': '+226',  // Burkina Faso
  'BI': '+257',  // Burundi
  'CF': '+236',  // Central African Republic
  'TD': '+235',  // Chad
  'CL': '+56',   // Chile
  'CX': '+61',   // Christmas Island
  'CC': '+61',   // Cocos (Keeling) Islands
  'CO': '+57',   // Colombia
  'KM': '+269',  // Comoros
  'CK': '+682',  // Cook Islands
  'HR': '+385',  // Croatia
  'CW': '+599',  // Curacao
  'CD': '+243',  // Democratic Republic of the Congo
  'TL': '+670',  // East Timor
  'SV': '+503',  // El Salvador
  'GQ': '+240',  // Equatorial Guinea
  'SZ': '+268',  // Eswatini
  'FK': '+500',  // Falkland Islands
  'FO': '+298',  // Faroe Islands
  'PF': '+689',  // French Polynesia
  'GI': '+350',  // Gibraltar
  'GL': '+299',  // Greenland
  'GU': '+1671', // Guam
  'GG': '+44',   // Guernsey (same as UK)
  'HK': '+852',  // Hong Kong
  'IN': '+91',   // India
  'ID': '+62',   // Indonesia
  'IL': '+972',  // Israel
  'IM': '+44',   // Isle of Man (same as UK)
  'JE': '+44',   // Jersey (same as UK)
  'XK': '+383',  // Kosovo
  'MY': '+60',   // Malaysia
  'AU': '+61',   // Australia
  'AT': '+43',   // Austria
  'IT': '+39',   // Italy
  'US': '+1',    // United States
};

// Function to get dialing code from country object (handles both ISO codes and dialing codes)
const getDialingCodeFromCountry = (country: any): string => {
  // If country.code is already a dialing code (starts with +), return it
  if (country.code && country.code.startsWith('+')) {
    return country.code;
  }
  
  // If country.code is an ISO code, check special cases first
  if (country.code && ISO_TO_DIALING_CODE_SPECIAL[country.code]) {
    return ISO_TO_DIALING_CODE_SPECIAL[country.code];
  }
  
  // If country.code is an ISO code, find the corresponding dialing code
  if (country.code) {
    // Find the dialing code for this ISO code
    for (const [dialingCode, isoCode] of Object.entries(DIALING_CODE_TO_ISO)) {
      if (isoCode === country.code) {
        return dialingCode;
      }
    }
  }
  
  // Fallback: return the code as-is (might be ISO code)
  return country.code || '??';
};

// Utility function to parse phone numbers and detect country
const parsePhoneNumber = (phoneNumber: string, countries: any[], rates: any[]) => {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  
  // If number starts with +, it includes country code
  if (phoneNumber.startsWith('+')) {
    const isoCode = detectCountryFromDialingCode(phoneNumber);
    if (isoCode) {
      const matchingCountry = countries.find(c => c.code === isoCode);
      const matchingRate = rates.find(r => r.countryCode === isoCode);
      
      if (matchingCountry && matchingRate) {
        return {
          country: matchingCountry,
          rate: matchingRate,
          formattedNumber: phoneNumber,
          dialingCode: Object.keys(DIALING_CODE_TO_ISO).find(k => DIALING_CODE_TO_ISO[k] === isoCode)
        };
      }
    }
  }
  
  // Special handling for common formats
  if (cleanNumber.length === 10 && !phoneNumber.startsWith('+')) {
    // Likely US/Canada number without country code
    const usCountry = countries.find(c => c.code === 'US');
    const usRate = rates.find(r => r.countryCode === 'US');
    if (usCountry && usRate) {
      return {
        country: usCountry,
        rate: usRate,
        formattedNumber: `+1${cleanNumber}`,
        dialingCode: '+1'
      };
    }
  }
  
  return null;
};

export default function Dialer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showError, showConfirm, ModalComponent } = useModal();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [rates, setRates] = useState<CallRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CallRate | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [callerIdOption, setCallerIdOption] = useState<"public" | "bought" | "verified">("public");
  const [showCallerOptions, setShowCallerOptions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "+1" });
  const [showCountryOptions, setShowCountryOptions] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [selectedCallerId, setSelectedCallerId] = useState<string>("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countries, setCountries] = useState<{ name: string; flag: string; code: string }[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [verifiedCallerIds, setVerifiedCallerIds] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactsList, setShowContactsList] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchRates();
      fetchUserData();
      fetchAvailableNumbers();
      fetchCountries();
      fetchVerifiedCallerIds();
      fetchContacts();
    }
  }, [status, router]);

  // Handle phone number from URL params (e.g., from contacts)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const numberParam = urlParams.get('number');
    const countryParam = urlParams.get('country');
    
    console.log('🔍 URL Parameters Check:', {
      numberParam,
      countriesLength: countries.length,
      ratesLength: rates.length,
      urlSearch: window.location.search
    });
    
    if (numberParam && countries.length > 0 && rates.length > 0) {
      console.log('✅ All conditions met, processing phone number:', numberParam);
      setPhoneNumber(numberParam);
      
      // First, always detect rate and update country based on phone number
      const isoCode = detectCountryFromDialingCode(numberParam);
      console.log('🔍 Detected ISO code from phone number:', isoCode);
      
      if (isoCode) {
        // Find the matching rate first (rates has all countries)
        const matchingRate = rates.find(r => r.countryCode === isoCode);
        
        console.log('🌍 Countries available:', countries.map(c => ({ code: c.code, name: c.name, flag: c.flag })));
        console.log('💰 All rates available:', rates.filter(r => r.countryCode === 'MA' || r.countryCode === 'US').map(r => ({ code: r.countryCode, country: r.country, flag: (r as any).flag })));
        console.log('🏳️ Matching rate found:', matchingRate);
        
        if (matchingRate) {
          console.log('✅ Setting rate to:', matchingRate.country);
          setSelectedRate(matchingRate);
          
          // Create a country object from the rate data
          // Find the dialing code for this ISO code
          let dialingCode = '+1'; // default fallback
          for (const [code, iso] of Object.entries(DIALING_CODE_TO_ISO)) {
            if (iso === matchingRate.countryCode) {
              dialingCode = code;
              break;
            }
          }
          
          const rateBasedCountry = {
            code: dialingCode,  // Use dialing code, not ISO code
            name: matchingRate.country,
            flag: (matchingRate as any).flag || '🌍',
            rate: matchingRate.rate,
            formattedRate: `from $${matchingRate.rate.toFixed(3)}/min`,
            currency: matchingRate.currency
          };
          
          console.log('🌍 Setting country from rate data:', rateBasedCountry);
          setSelectedCountry(rateBasedCountry);
          
          // Also update the phone number display to confirm detection worked
          if (rateBasedCountry.flag === '🇲🇦') {
            console.log('🎉 SUCCESS: Morocco detected and set!');
          }
        } else {
          console.log('❌ No matching rate found for ISO:', isoCode);
          
          // Fallback: try to find in popular countries list
          const matchingCountry = countries.find(c => c.code === isoCode);
          if (matchingCountry) {
            console.log('✅ Using popular country fallback:', matchingCountry.name);
            setSelectedCountry(matchingCountry);
          }
        }
      }
      
      // If we have a country hint from the contact and no phone detection worked, use it as fallback
      if (!isoCode && countryParam) {
        const matchingCountry = countries.find(c => 
          c.name.toLowerCase() === countryParam.toLowerCase()
        );
        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
        }
      }
    }
  }, [countries, rates]); // Dependencies on both countries and rates

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside the country dropdown
      if (showCountryOptions && !target.closest('[data-country-dropdown]')) {
        setShowCountryOptions(false);
      }
      
      // Check if click is outside the caller options dropdown  
      if (showCallerOptions && !target.closest('[data-caller-dropdown]')) {
        setShowCallerOptions(false);
      }
      
      // Check if click is outside the contacts dropdown
      if (showContactsList && !target.closest('[data-contacts-dropdown]')) {
        setShowContactsList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCallerOptions, showCountryOptions, showContactsList]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalling && callStatus === "answered") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling, callStatus]);

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const data = await response.json();
        setRates(data);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchAvailableNumbers = async () => {
    try {
      const response = await fetch("/api/user/phone-numbers");
      if (response.ok) {
        const numbers = await response.json();
        setAvailableNumbers(numbers);
        
        // Set default caller ID based on priority: public > bought > verified
        if (!selectedCallerId) {
          const publicNumbers = numbers.filter((num: any) => num.type === 'public');
          const boughtNumbers = numbers.filter((num: any) => num.type === 'premium');
          
          if (publicNumbers.length > 0) {
            setSelectedCallerId(publicNumbers[0].phoneNumber);
            setCallerIdOption("public");
          } else if (boughtNumbers.length > 0) {
            setSelectedCallerId(boughtNumbers[0].phoneNumber);
            setCallerIdOption("bought");
          } else {
            // Fallback to default platform number if no numbers in API
            setSelectedCallerId("+12293983710");
            setCallerIdOption("public");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch available numbers:", error);
    }
  };

  const fetchVerifiedCallerIds = async () => {
    try {
      const response = await fetch("/api/user/caller-ids");
      if (response.ok) {
        const data = await response.json();
        const verified = data.callerIds?.filter((id: any) => id.status === 'VERIFIED') || [];
        setVerifiedCallerIds(verified);
        
        // Set default verified caller ID if no other caller ID is selected
        if (verified.length > 0 && !selectedCallerId && availableNumbers.length === 0) {
          setSelectedCallerId(verified[0].phoneNumber);
          setCallerIdOption("verified");
        }
      }
    } catch (error) {
      console.error("Failed to fetch verified caller IDs:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/user/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setContacts([]);
    }
  };

  const fetchCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const data = await response.json();
        
        // Create countries from rates using flags from database
        const uniqueCountries = new Map<string, { name: string; flag: string; code: string }>();
        data.forEach((rate: any) => {
          if (!uniqueCountries.has(rate.country)) {
            const flag = rate.flag || "🌍"; // Use flag from database, fallback to earth emoji
            
            // Convert ISO country code to international dialing code
            const dialingCode = Object.keys(DIALING_CODE_TO_ISO).find(
              key => DIALING_CODE_TO_ISO[key] === rate.countryCode
            );
            
            uniqueCountries.set(rate.country, {
              name: rate.country,
              flag: flag,
              code: rate.countryCode // Always store ISO code, let getDialingCodeFromCountry handle conversion
            });
          }
        });
        
        const countriesArray = Array.from(uniqueCountries.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        if (countriesArray.length > 0) {
          setCountries(countriesArray);
        }
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  );

  // Handle country selection
  const handleCountrySelect = (country: { name: string; flag: string; code: string }) => {
    setSelectedCountry(country);
    setShowCountryOptions(false);
    setCountrySearch("");
    
    // If phone number exists, update it with the new country code
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      let newNumber = phoneNumber;
      
      // If number doesn't start with +, prepend the new country code
      if (!phoneNumber.startsWith("+")) {
        newNumber = country.code + cleanNumber;
      } else {
        // Replace existing country code with new one
        const currentIsoCode = detectCountryFromDialingCode(phoneNumber);
        if (currentIsoCode) {
          // Find the current dialing code
          const currentDialingCode = Object.keys(DIALING_CODE_TO_ISO).find(
            key => DIALING_CODE_TO_ISO[key] === currentIsoCode
          );
          if (currentDialingCode) {
            const currentCodeDigits = currentDialingCode.replace("+", "");
            const nationalNumber = cleanNumber.substring(currentCodeDigits.length);
            newNumber = country.code + nationalNumber;
          } else {
            // Fallback: just prepend new code to cleaned number
            newNumber = country.code + cleanNumber;
          }
        } else {
          // Fallback: just prepend new code to cleaned number
          newNumber = country.code + cleanNumber;
        }
      }
      
      setPhoneNumber(newNumber);
      const rate = detectCountry(newNumber);
      setSelectedRate(rate || null);
    } else {
      // No phone number yet, find the rate for this country using ISO code
      const isoCode = DIALING_CODE_TO_ISO[country.code];
      const rate = rates.find(r => r.countryCode === isoCode);
      setSelectedRate(rate || null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const detectCountry = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    
    // If number doesn't start with +, it might be a local number
    if (!number.startsWith('+') && cleanNumber.length <= 10) {
      // Keep current selected country for local numbers
      return rates.find(rate => rate.countryCode === selectedCountry.code);
    }
    
    // For international numbers, use the dialing code mapping
    if (number.startsWith('+')) {
      const isoCode = detectCountryFromDialingCode(number);
      console.log('detectCountry - number:', number, 'detected ISO:', isoCode);
      if (isoCode) {
        // Find the matching rate using ISO code
        const matchingRate = rates.find(rate => rate.countryCode === isoCode);
        if (matchingRate) {
          // Update selected country to match detected rate - find by ISO code mapping
          const matchingCountry = countries.find(c => {
            const countryIsoCode = DIALING_CODE_TO_ISO[c.code];
            return countryIsoCode === isoCode;
          });
          if (matchingCountry) {
            console.log('detectCountry - updating country to:', matchingCountry);
            setSelectedCountry(matchingCountry);
          }
          return matchingRate;
        }
      }
    }
    
    // If no match found, try to match by the selected country
    const fallbackRate = rates.find(rate => {
      const countryIsoCode = DIALING_CODE_TO_ISO[selectedCountry.code];
      return rate.countryCode === (countryIsoCode || selectedCountry.code);
    });
    return fallbackRate;
  };

  const handleNumberChange = (value: string) => {
    if (isCalling) return;
    
    // Remove all non-digit characters
    const digitsOnly = value.replace(/[^0-9]/g, '');
    
    // If empty, just clear
    if (!digitsOnly) {
      setPhoneNumber('');
      setSelectedRate(null);
      return;
    }
    
    // Auto-format with selected country code
    let formattedNumber = '';
    const countryCodeDigits = selectedCountry.code.replace('+', '');
    
    // If user typed the country code themselves, don't duplicate it
    if (digitsOnly.startsWith(countryCodeDigits)) {
      formattedNumber = '+' + digitsOnly;
    } else {
      // Prepend the selected country code
      formattedNumber = selectedCountry.code + digitsOnly;
    }
    
    setPhoneNumber(formattedNumber);
    const rate = detectCountry(formattedNumber);
    setSelectedRate(rate || null);
  };

  const handleNumberInput = (digit: string) => {
    if (isCalling) return;
    setPhoneNumber(prev => {
      // If starting fresh or number doesn't have country code, add it
      if (!prev || !prev.startsWith('+')) {
        const newNumber = selectedCountry.code + digit;
        const rate = detectCountry(newNumber);
        setSelectedRate(rate || null);
        return newNumber;
      }
      
      // Otherwise just append the digit
      const newNumber = prev + digit;
      const rate = detectCountry(newNumber);
      setSelectedRate(rate || null);
      return newNumber;
    });
  };

  const handleContactSelect = (contact: any) => {
    if (isCalling) return;
    setPhoneNumber(contact.phoneNumber);
    const rate = detectCountry(contact.phoneNumber);
    setSelectedRate(rate || null);
    setShowContactsList(false);
  };

  const deleteLastDigit = () => {
    if (isCalling) return;
    setPhoneNumber(prev => {
      const newNumber = prev.slice(0, -1);
      const rate = detectCountry(newNumber);
      setSelectedRate(rate || null);
      return newNumber;
    });
  };

  const clearNumber = () => {
    if (isCalling) return;
    setPhoneNumber("");
    setSelectedRate(null);
  };

  const initiateCall = async () => {
    if (!phoneNumber || !user) return;

    // Check if we have a rate for this number
    if (!selectedRate) {
      showError("Rate Not Found", "Unable to determine rates for this number. Please check the number format.");
      return;
    }

    // Check balance
    const estimatedCost = selectedRate.rate * 0.5; // Minimum 30 seconds
    if (user.balance < estimatedCost) {
      showConfirm(
        "Insufficient Balance",
        `Insufficient balance for this call. You need at least $${estimatedCost.toFixed(3)} but have $${user.balance.toFixed(2)}.\n\nWould you like to add credits now?`,
        () => router.push("/dashboard/add-credits"),
        "Add Credits",
        "Cancel"
      );
      return;
    }

    setIsCalling(true);
    setCallStatus("initiating");

    try {
      const callerInfo = {
        type: callerIdOption,
        verifiedId: callerIdOption === "verified" ? selectedCallerId : null,
      };

      // Determine the "from" number based on caller ID type
      let fromNumber = "+1234567890"; // Default fallback
      if (callerIdOption === "verified" && selectedCallerId) {
        fromNumber = selectedCallerId;
      } else if (callerIdOption === "bought" && selectedCallerId) {
        fromNumber = selectedCallerId;
      }

      const response = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: fromNumber,
          callerIdType: callerIdOption,
          callerIdInfo: callerInfo,
        }),
      });

      if (response.ok) {
        setCallStatus("ringing");
        // Simulate call progression
        setTimeout(() => {
          setCallStatus("answered");
          // Start billing simulation
          const interval = setInterval(() => {
            if (user) {
              const currentCost = (callDuration / 60) * selectedRate.rate;
              if (user.balance - currentCost <= 0) {
                showError("Call Ended", "Call ended: Insufficient balance");
                endCall();
                clearInterval(interval);
              }
            }
          }, 10000); // Check every 10 seconds
        }, 3000);
      } else {
        const errorData = await response.json();
        showError("Call Failed", `Call failed: ${errorData.error || "Unknown error"}`);
        setCallStatus("failed");
        setIsCalling(false);
      }
    } catch (error) {
      console.error("Call initiation error:", error);
      showError("Call Failed", "Call failed: Network error. Please try again.");
      setCallStatus("failed");
      setIsCalling(false);
    }
  };

  const endCall = async () => {
    setIsCalling(false);
    setCallStatus("");
    setCallDuration(0);
    // Keep the number for easy redial
    setSelectedRate(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      {isCalling ? (
        // Full Screen Call Interface with iPhone shadows and Skype green  
        <div className="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white">
          {/* Call Status Header */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8">
            <div className="text-center mb-6 sm:mb-8 bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/30">
              <div className="text-xs sm:text-sm text-blue-800 mb-2 uppercase tracking-wide font-bold">
                {callStatus}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-2 text-blue-900">
                {phoneNumber}
              </div>
              {selectedRate && (
                <div className="text-base sm:text-lg text-blue-700 font-medium">
                  {selectedRate.country}
                </div>
              )}
            </div>

            {/* Call Duration */}
            <div className="text-4xl sm:text-6xl font-bold mb-8 sm:mb-12 text-blue-900 bg-blue-100/30 backdrop-blur-sm rounded-2xl px-6 sm:px-8 py-3 sm:py-4 shadow-2xl">
              {callStatus === "answered" ? formatDuration(callDuration) : ""}
            </div>

            {/* Cost Display */}
            {selectedRate && callDuration > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl px-4 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-8 shadow-2xl border-2 sm:border-4 border-white animate-pulse max-w-xs w-full">
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-white font-bold">Call Cost</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    ${((callDuration / 60) * selectedRate.rate).toFixed(4)}
                  </div>
                  <div className="text-xs text-green-100 font-medium">
                    Rate: ${selectedRate.rate.toFixed(3)}/min
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* iPhone-style Call Controls with Skype blue */}
          <div className="pb-8 sm:pb-12 px-4 sm:px-8">
            <div className="flex justify-center items-center space-x-8 sm:space-x-16">
              <button
                onClick={toggleMute}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 active:scale-95 border-2 sm:border-4 border-white touch-manipulation ${
                  isMuted 
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700" 
                    : "bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
                }`}
              >
                {isMuted ? <MicOff className="h-6 w-6 sm:h-8 sm:w-8" /> : <Mic className="h-6 w-6 sm:h-8 sm:w-8" />}
              </button>

              <button
                onClick={endCall}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white w-20 h-20 sm:w-28 sm:h-28 rounded-full hover:from-red-600 hover:to-red-700 flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-red-500/50 active:scale-95 transform border-2 sm:border-4 border-white touch-manipulation"
              >
                <PhoneOff className="h-8 w-8 sm:h-12 sm:w-12" />
              </button>

              <button
                onClick={toggleSpeaker}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 active:scale-95 border-2 sm:border-4 border-white touch-manipulation ${
                  isSpeakerOn 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800" 
                    : "bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
                }`}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6 sm:h-8 sm:w-8" /> : <VolumeX className="h-6 w-6 sm:h-8 sm:w-8" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // iPhone-style dialer with Skype blue colors and shadows
        <div className="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-3xl shadow-2xl border border-blue-200">
          {/* Status and Balance */}
          <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-3 sm:pb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/25"></div>
              <button 
                onClick={() => router.push("/dashboard/add-credits")}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 touch-manipulation"
              >
                Balance: ${user ? user.balance.toFixed(2) : "0.00"} +
              </button>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-white mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full px-4 py-2 shadow-xl">
                <div className="text-white animate-bounce">✓</div>
                <span className="text-sm font-medium">1 min test call available</span>
              </div>
            </div>
          </div>

          {/* Clean Phone Input Design (matching home page) */}
          <div className="px-4 sm:px-6 mb-6 relative">
            <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
              {/* Country Selector Button */}
              <button
                type="button"
                onClick={() => setShowCountryOptions(!showCountryOptions)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-3 sm:py-4 bg-blue-50 hover:bg-blue-100 transition-colors border-r border-gray-200"
                disabled={isCalling}
                data-country-dropdown="button"
              >
                <span className="text-xl sm:text-2xl">{selectedCountry.flag}</span>
                <span className="text-sm sm:text-base font-bold text-gray-700">{selectedCountry.code}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showCountryOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Separator */}
              <div className="w-px h-6 bg-gray-300 mx-2"></div>

              {/* Phone Number Input */}
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => handleNumberChange(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter phone number"
                className="flex-1 border-0 outline-none bg-transparent text-lg sm:text-xl font-mono text-gray-800 placeholder-gray-400"
                disabled={isCalling}
              />

              {/* Clear Button */}
              {phoneNumber && (
                <button
                  type="button"
                  onClick={clearNumber}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={isCalling}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Contacts Button */}
              <button
                type="button"
                onClick={() => setShowContactsList(!showContactsList)}
                className="p-1.5 mr-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600 flex-shrink-0"
                disabled={isCalling}
                title="Select from contacts"
              >
                <Contact className="w-5 h-5" />
              </button>
            </div>

            {/* Country Dropdown */}
            {showCountryOptions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-72 overflow-hidden z-50" data-country-dropdown="menu">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                {/* Countries List */}
                <div className="max-h-48 overflow-y-auto">
                  {isLoadingCountries ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading countries...</span>
                    </div>
                  ) : countries.length === 0 ? (
                    <div className="px-3 py-4 text-gray-500 text-sm text-center">
                      No countries available
                    </div>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code + country.name}
                        onClick={() => handleCountrySelect(country)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                          selectedCountry.code === country.code ? "bg-blue-100 text-blue-700" : "text-gray-700"
                        }`}
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="font-medium flex-1">{country.name}</span>
                        <span className="text-blue-600 font-bold">{getDialingCodeFromCountry(country)}</span>
                      </button>
                    ))
                  )}
                  {!isLoadingCountries && filteredCountries.length === 0 && countrySearch && (
                    <div className="px-3 py-4 text-gray-500 text-sm text-center">
                      No countries found for "{countrySearch}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contacts Dropdown */}
            {showContactsList && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-72 overflow-hidden z-50" data-contacts-dropdown="menu">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                {/* Contacts List */}
                <div className="max-h-48 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Contact className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm mb-3">No contacts yet</p>
                      <button
                        onClick={() => router.push("/dashboard/contacts")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Add your first contact
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const filteredContacts = contacts.filter(contact =>
                        contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                        contact.phoneNumber.includes(contactSearch)
                      );
                      
                      return filteredContacts.length === 0 ? (
                        <div className="px-3 py-4 text-gray-500 text-sm text-center">
                          No contacts found for "{contactSearch}"
                        </div>
                      ) : (
                        filteredContacts.map((contact: any) => (
                          <button
                            key={contact.id}
                            onClick={() => handleContactSelect(contact)}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                          >
                            <div className="bg-blue-100 p-2 rounded-full">
                              <Contact className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                              <p className="text-sm text-gray-500 truncate">{contact.phoneNumber}</p>
                            </div>
                            <Phone className="w-4 h-4 text-green-600" />
                          </button>
                        ))
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Call From Options */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 text-sm font-medium">Call from:</span>
              <div className="relative">
                <button 
                  onClick={() => setShowCallerOptions(!showCallerOptions)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full px-4 py-2 text-sm shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                  data-caller-dropdown="button"
                >
                  <Globe className="h-4 w-4 text-white" />
                  <span className="font-bold">
                    {callerIdOption === "public" && (selectedCallerId || "Public number")}
                    {callerIdOption === "bought" && (selectedCallerId || "Bought number")}
                    {callerIdOption === "verified" && (selectedCallerId || "Verified caller ID")}
                  </span>
                  <svg className={`h-4 w-4 text-white transition-transform ${showCallerOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dynamic Dropdown Menu */}
                {showCallerOptions && (
                  <div className="absolute right-0 mt-2 w-72 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border border-blue-200 py-2 z-50 animate-in slide-in-from-top-2 max-h-96 overflow-y-auto" data-caller-dropdown="menu">
                    
                    {/* Public Numbers Section - Always Available */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100">
                      🌐 Platform Numbers (Free)
                    </div>
                    
                    {/* Show available public numbers OR fallback option */}
                    {availableNumbers.filter(num => num.type === 'public').length > 0 ? (
                      availableNumbers.filter(num => num.type === 'public').map((number) => (
                        <button 
                          key={number.id}
                          onClick={() => {
                            setCallerIdOption("public");
                            setSelectedCallerId(number.phoneNumber);
                            setShowCallerOptions(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                            callerIdOption === "public" && selectedCallerId === number.phoneNumber ? "bg-blue-100 border-r-2 border-blue-500" : ""
                          }`}
                        >
                          <Globe className="h-5 w-5 text-blue-600" />
                          <div className="flex-1 text-left">
                            <div className="text-gray-900 font-medium">{number.phoneNumber}</div>
                            <div className="text-xs text-gray-500">{number.country}</div>
                          </div>
                          {callerIdOption === "public" && selectedCallerId === number.phoneNumber && 
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          }
                        </button>
                      ))
                    ) : (
                      /* Fallback: Default platform number */
                      <button 
                        onClick={() => {
                          setCallerIdOption("public");
                          setSelectedCallerId("+12293983710"); // Your default Twilio number
                          setShowCallerOptions(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                          callerIdOption === "public" ? "bg-blue-100 border-r-2 border-blue-500" : ""
                        }`}
                      >
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div className="flex-1 text-left">
                          <div className="text-gray-900 font-medium">+12293983710</div>
                          <div className="text-xs text-gray-500">United States • Default</div>
                        </div>
                        {callerIdOption === "public" && 
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        }
                      </button>
                    )}

                    {/* Bought Numbers Section */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                      📱 Your Bought Numbers
                    </div>
                    
                    {availableNumbers.filter(num => num.type === 'premium').length > 0 ? (
                      availableNumbers.filter(num => num.type === 'premium').map((number) => (
                        <button 
                          key={number.id}
                          onClick={() => {
                            setCallerIdOption("bought");
                            setSelectedCallerId(number.phoneNumber);
                            setShowCallerOptions(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                            callerIdOption === "bought" && selectedCallerId === number.phoneNumber ? "bg-blue-100 border-r-2 border-blue-500" : ""
                          }`}
                        >
                          <Phone className="h-5 w-5 text-green-600" />
                          <div className="flex-1 text-left">
                            <div className="text-gray-900 font-medium">{number.phoneNumber}</div>
                            <div className="text-xs text-green-600">${number.monthlyFee}/month</div>
                          </div>
                          {callerIdOption === "bought" && selectedCallerId === number.phoneNumber && 
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          }
                        </button>
                      ))
                    ) : (
                      /* No bought numbers - show buy option */
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>No numbers purchased yet</span>
                        </div>
                        <button 
                          onClick={() => {
                            router.push("/dashboard/buy-number");
                            setShowCallerOptions(false);
                          }}
                          className="text-green-600 hover:text-green-700 text-xs font-medium"
                        >
                          → Buy your first number
                        </button>
                      </div>
                    )}
                    
                    {/* Verified Caller IDs Section */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                      ✅ Your Verified Numbers
                    </div>
                    
                    {verifiedCallerIds.length > 0 ? (
                      verifiedCallerIds.map((callerId) => (
                        <button 
                          key={callerId.id}
                          onClick={() => {
                            setCallerIdOption("verified");
                            setSelectedCallerId(callerId.phoneNumber);
                            setShowCallerOptions(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                            callerIdOption === "verified" && selectedCallerId === callerId.phoneNumber ? "bg-blue-100 border-r-2 border-blue-500" : ""
                          }`}
                        >
                          <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-gray-900 font-medium">{callerId.phoneNumber}</div>
                            <div className="text-xs text-green-600">✅ Verified • Custom rates may apply</div>
                          </div>
                          {callerIdOption === "verified" && selectedCallerId === callerId.phoneNumber && 
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          }
                        </button>
                      ))
                    ) : (
                      /* No verified caller IDs - show add option */
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center">
                            <svg className="h-2 w-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>No caller IDs verified yet</span>
                        </div>
                        <button 
                          onClick={() => {
                            router.push("/dashboard/settings");
                            setShowCallerOptions(false);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          → Verify your own number
                        </button>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                      🚀 Quick Actions
                    </div>
                    
                    <div className="p-2 space-y-2">
                      {/* Verify Your Own Number */}
                      <button 
                        onClick={() => {
                          router.push("/dashboard/settings");
                          setShowCallerOptions(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-blue-50 transition-colors border border-dashed border-blue-200 rounded-lg"
                      >
                        <div className="h-4 w-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="h-2 w-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 text-sm font-medium">Verify your number</span>
                        <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">FREE</span>
                      </button>
                      
                      {/* Buy More Numbers */}
                      <button 
                        onClick={() => {
                          router.push("/dashboard/buy-number");
                          setShowCallerOptions(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-green-50 transition-colors border border-dashed border-green-200 rounded-lg"
                      >
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-gray-700 text-sm font-medium">Buy phone number</span>
                        <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">PREMIUM</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            

            
          </div>

          {selectedRate && (
            <div className="px-6 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl px-4 py-3 border border-blue-200 shadow-sm">
                <div className="flex items-center justify-center space-x-3">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {selectedRate.country} - ${selectedRate.rate.toFixed(3)}/min
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Simple Number Keypad */}
          <div className="px-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Row 1: 1, 2, 3 */}
              <button
                onClick={() => handleNumberInput("1")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">1</span>
              </button>
              <button
                onClick={() => handleNumberInput("2")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">2</span>
              </button>
              <button
                onClick={() => handleNumberInput("3")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">3</span>
              </button>

              {/* Row 2: 4, 5, 6 */}
              <button
                onClick={() => handleNumberInput("4")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">4</span>
              </button>
              <button
                onClick={() => handleNumberInput("5")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">5</span>
              </button>
              <button
                onClick={() => handleNumberInput("6")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">6</span>
              </button>

              {/* Row 3: 7, 8, 9 */}
              <button
                onClick={() => handleNumberInput("7")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">7</span>
              </button>
              <button
                onClick={() => handleNumberInput("8")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">8</span>
              </button>
              <button
                onClick={() => handleNumberInput("9")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">9</span>
              </button>

              {/* Row 4: *, 0, # */}
              <button
                onClick={() => handleNumberInput("*")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">*</span>
              </button>
              <button
                onClick={() => handleNumberInput("0")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">0</span>
              </button>
              <button
                onClick={() => handleNumberInput("#")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">#</span>
              </button>
            </div>
          </div>

          {/* Quick Contacts Section */}
          {contacts.length > 0 && (
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-700 text-sm font-medium">Quick Contacts</h3>
                <button
                  onClick={() => router.push("/dashboard/contacts")}
                  className="text-blue-600 text-xs hover:text-blue-700 transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {contacts.slice(0, 3).map((contact: any) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    disabled={isCalling}
                    className="w-full flex items-center space-x-3 p-3 bg-white hover:bg-gray-50 rounded-xl transition-colors shadow-sm border border-gray-100 disabled:opacity-50"
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Contact className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">{contact.phoneNumber}</p>
                    </div>
                    <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simple Call Button */}
          <div className="px-6 pb-6">
            <div className="flex justify-center mb-6">
              <button
                onClick={initiateCall}
                disabled={!phoneNumber || isCalling}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-16 h-16 rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 transform"
              >
                <Phone className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}
      {ModalComponent}
    </div>
  );
}
