/**
 * Simplified Country Trade Status Database
 * 
 * This file contains simple lists of countries for GSP eligibility and non-NTR status.
 * Since the API only returns rates and indicators without country mappings, we maintain
 * these hard-coded lists to determine which rates apply to which countries.
 */

// Column 2 (Non-NTR) countries - these countries do not have Normal Trade Relations with the US
export const NON_NTR_COUNTRIES = [
  'BY', // Belarus (Republic of Belarus)
  'CU', // Cuba
  'KP', // North Korea (DPRK)
  'RU', // Russian Federation
] as const;

// Least-Developed Beneficiary Countries (LDBCs)
// These countries are designated as least-developed beneficiary developing countries
// pursuant to section 502(a)(2) of the Trade Act of 1974, as amended.
// LDBCs receive additional benefits under GSP.
export const LEAST_DEVELOPED_BENEFICIARY_COUNTRIES = [
  'AF', // Afghanistan
  'AO', // Angola
  'BJ', // Benin
  'BT', // Bhutan
  'BF', // Burkina Faso
  'MM', // Burma
  'BI', // Burundi
  'KH', // Cambodia
  'CF', // Central African Republic
  'TD', // Chad
  'KM', // Comoros
  'CD', // Congo (Kinshasa)
  'DJ', // Djibouti
  'ET', // Ethiopia
  'GM', // Gambia, The
  'GN', // Guinea
  'GW', // Guinea-Bissau
  'HT', // Haiti
  'KI', // Kiribati
  'LS', // Lesotho
  'LR', // Liberia
  'MG', // Madagascar
  'MW', // Malawi
  'ML', // Mali
  'MR', // Mauritania
  'MZ', // Mozambique
  'NP', // Nepal
  'NE', // Niger
  'YE', // Republic of Yemen
  'RW', // Rwanda
  'WS', // Samoa
  'ST', // Sao Tomé and Principe
  'SN', // Senegal
  'SL', // Sierra Leone
  'SO', // Somalia
  'SS', // South Sudan
  'TZ', // Tanzania
  'SB', // Solomon Islands
  'TL', // Timor-Leste
  'TG', // Togo
  'TV', // Tuvalu
  'UG', // Uganda
  'VU', // Vanuatu
  'ZM', // Zambia
] as const;

// GSP-eligible countries - these countries are eligible for Generalized System of Preferences
export const GSP_ELIGIBLE_COUNTRIES: string[] = [
  // Independent GSP Countries
  'AF', // Afghanistan
  'AL', // Albania
  'DZ', // Algeria
  'AO', // Angola
  'AR', // Argentina
  'AM', // Armenia
  'AZ', // Azerbaijan
  'BZ', // Belize
  'BJ', // Benin
  'BT', // Bhutan
  'BO', // Bolivia
  'BA', // Bosnia and Herzegovina
  'BW', // Botswana
  'BR', // Brazil
  'BF', // Burkina Faso
  'MM', // Burma (Myanmar)
  'BI', // Burundi
  'CI', // Côte d'Ivoire
  'KH', // Cambodia
  'CM', // Cameroon
  'CV', // Cape Verde
  'CF', // Central African Republic
  'TD', // Chad
  'KM', // Comoros
  'CG', // Congo (Brazzaville)
  'CD', // Congo (Kinshasa)
  'DJ', // Djibouti
  'DM', // Dominica
  'EC', // Ecuador
  'EG', // Egypt
  'ER', // Eritrea
  'SZ', // Eswatini (Swaziland)
  'ET', // Ethiopia
  'FJ', // Fiji
  'GA', // Gabon
  'GM', // Gambia, The
  'GE', // Georgia
  'GH', // Ghana
  'GD', // Grenada
  'GN', // Guinea
  'GW', // Guinea-Bissau
  'GY', // Guyana
  'HT', // Haiti
  'ID', // Indonesia
  'IQ', // Iraq
  'JM', // Jamaica
  'JO', // Jordan
  'KZ', // Kazakhstan
  'KE', // Kenya
  'KI', // Kiribati
  'XK', // Kosovo
  'KG', // Kyrgyzstan
  'LB', // Lebanon
  'LS', // Lesotho
  'LR', // Liberia
  'MG', // Madagascar
  'MW', // Malawi
  'MV', // Maldives
  'ML', // Mali
  'MR', // Mauritania
  'MU', // Mauritius
  'MD', // Moldova
  'MN', // Mongolia
  'ME', // Montenegro
  'MZ', // Mozambique
  'NA', // Namibia
  'NP', // Nepal
  'NE', // Niger
  'NG', // Nigeria
  'MK', // North Macedonia
  'PK', // Pakistan
  'PG', // Papua New Guinea
  'PY', // Paraguay
  'PH', // Philippines
  'YE', // Republic of Yemen
  'RW', // Rwanda
  'LC', // Saint Lucia
  'VC', // Saint Vincent and the Grenadines
  'WS', // Samoa
  'ST', // Sao Tomé and Principe
  'SN', // Senegal
  'RS', // Serbia
  'SL', // Sierra Leone
  'SB', // Solomon Islands
  'SO', // Somalia
  'ZA', // South Africa
  'SS', // South Sudan
  'LK', // Sri Lanka
  'SR', // Suriname
  'TZ', // Tanzania
  'TH', // Thailand
  'TL', // Timor-Leste
  'TG', // Togo
  'TO', // Tonga
  'TN', // Tunisia
  'TV', // Tuvalu
  'UG', // Uganda
  'UA', // Ukraine
  'UZ', // Uzbekistan
  'VU', // Vanuatu
  'ZM', // Zambia
  'ZW', // Zimbabwe
  
  // Non-Independent Countries and Territories
  'AI', // Anguilla
  'IO', // British Indian Ocean Territory
  'CX', // Christmas Island (Australia)
  'CC', // Cocos (Keeling) Islands
  'CK', // Cook Islands
  'FK', // Falkland Islands (Islas Malvinas)
  'HM', // Heard Island and McDonald Islands
  'MS', // Montserrat
  'NU', // Niue
  'NF', // Norfolk Island
  'PN', // Pitcairn Islands
  'SH', // Saint Helena
  'TK', // Tokelau
  'VG', // Virgin Islands, British
  'WF', // Wallis and Futuna
  'PS', // West Bank and Gaza Strip
  'EH', // Western Sahara
  
  // Note: The following associations of countries are treated as one country for GSP purposes,
  // but their individual member countries are already included above:
  // - WAEMU (West African Economic and Monetary Union)
  // - Cartagena Agreement (Andean Group)
  // - ASEAN (Association of South East Asian Nations)
  // - CARICOM (Caribbean Common Market)
  // - SAARC (South Asian Association for Regional Cooperation)
  // - SADC (Southern Africa Development Community)
];

// Simple helper functions

/**
 * Check if a country is Column 2 (Non-NTR)
 */
export function isNonNTRCountry(countryCode: string): boolean {
  return NON_NTR_COUNTRIES.includes(countryCode as any);
}

/**
 * Check if a country is eligible for GSP
 */
export function isGSPEligible(countryCode: string): boolean {
  return GSP_ELIGIBLE_COUNTRIES.includes(countryCode);
}

/**
 * Check if a country is a Least-Developed Beneficiary Country (LDBC)
 * LDBCs receive additional benefits under GSP
 */
export function isLeastDevelopedBeneficiary(countryCode: string): boolean {
  return LEAST_DEVELOPED_BENEFICIARY_COUNTRIES.includes(countryCode as any);
}
