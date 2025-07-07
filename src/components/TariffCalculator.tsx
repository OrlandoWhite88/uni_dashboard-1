import React, { useState, useEffect, useMemo } from "react";
import { getTariffInfo } from "@/lib/classifierService";
import { getUserClassifications, ClassificationRecord } from "@/lib/supabaseService";
import { useAuth } from "@clerk/clerk-react";
import { Loader2, AlertCircle, DollarSign, Package, Truck, FileText, Calculator, Info, ChevronDown, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomButton from "./ui/CustomButton";

interface TariffCalculatorProps {
  initialHsCode?: string;
}

interface ShipmentDetails {
  hsCode: string;
  description: string;
  invoiceValue: string | number;
  freightCost: string | number;
  insuranceCost: string | number;
  quantity: string | number;
  weight: string | number;
  countryOfOrigin: string;
  destinationCountry: string;
  vatRate: string | number;
  additionalFees: string | number;
  isFtaOriginCompliant: boolean;
}

interface CalculationResult {
  cifValue: number;
  dutyAmount: number;
  vatBase: number;
  vatAmount: number;
  totalPayable: number;
  effectiveDutyRate: number;
  breakdown: {
    label: string;
    value: number;
    description: string;
    isHighlight?: boolean;
  }[];
  dutyRateUsed: string;
  programApplied?: string;
  rateSource: string;
  potentialSavings?: {
    standardDuty: number;
    appliedDuty: number;
    savings: number;
    programUsed: string;
  };
  warnings: string[];
  eligiblePrograms: EligibleProgram[];
}

interface EligibleProgram {
  name: string;
  symbol: string;
  rate: number;
  rateType: string;
  description: string;
  requirements: string[];
}

// Enhanced tariff data interface matching API response
interface TariffData {
  hts8: string | number;
  brief_description?: string;
  quantity_1_code?: string;
  quantity_2_code?: string;
  wto_binding_code?: string;
  mfn_text_rate?: string;
  mfn_rate_type_code?: string | number;
  mfn_ad_val_rate?: number;
  mfn_specific_rate?: number;
  mfn_other_rate?: number;
  col1_special_text?: string;
  col2_text_rate?: string;
  col2_rate_type_code?: string | number;
  col2_ad_val_rate?: number;
  col2_specific_rate?: number;
  col2_other_rate?: number;
  begin_effect_date?: string;
  end_effective_date?: string;
  
  // Trade program indicators
  gsp_indicator?: string;
  gsp_ctry_excluded?: string;
  nafta_canada_ind?: string;
  nafta_mexico_ind?: string;
  mexico_rate_type_code?: string | number;
  mexico_ad_val_rate?: number;
  mexico_specific_rate?: number;
  cbi_indicator?: string;
  cbi_ad_val_rate?: number;
  cbi_specific_rate?: number;
  agoa_indicator?: string;
  israel_fta_indicator?: string;
  jordan_indicator?: string;
  jordan_rate_type_code?: string | number;
  jordan_ad_val_rate?: number;
  jordan_specific_rate?: number;
  jordan_other_rate?: number;
  singapore_indicator?: string;
  singapore_rate_type_code?: string | number;
  singapore_ad_val_rate?: number;
  singapore_specific_rate?: number;
  singapore_other_rate?: number;
  chile_indicator?: string;
  chile_rate_type_code?: string | number;
  chile_ad_val_rate?: number;
  chile_specific_rate?: number;
  chile_other_rate?: number;
  morocco_indicator?: string;
  morocco_rate_type_code?: string | number;
  morocco_ad_val_rate?: number;
  morocco_specific_rate?: number;
  morocco_other_rate?: number;
  australia_indicator?: string;
  australia_rate_type_code?: string | number;
  australia_ad_val_rate?: number;
  australia_specific_rate?: number;
  australia_other_rate?: number;
  bahrain_indicator?: string;
  bahrain_rate_type_code?: string | number;
  bahrain_ad_val_rate?: number;
  bahrain_specific_rate?: number;
  bahrain_other_rate?: number;
  dr_cafta_indicator?: string;
  dr_cafta_rate_type_code?: string | number;
  dr_cafta_ad_val_rate?: number;
  dr_cafta_specific_rate?: number;
  dr_cafta_other_rate?: number;
  oman_indicator?: string;
  oman_rate_type_code?: string | number;
  oman_ad_val_rate?: number;
  oman_specific_rate?: number;
  oman_other_rate?: number;
  peru_indicator?: string;
  peru_rate_type_code?: string | number;
  peru_ad_val_rate?: number;
  peru_specific_rate?: number;
  peru_other_rate?: number;
  korea_indicator?: string;
  korea_rate_type_code?: string | number;
  korea_ad_val_rate?: number;
  korea_specific_rate?: number;
  korea_other_rate?: number;
  colombia_indicator?: string;
  colombia_rate_type_code?: string | number;
  colombia_ad_val_rate?: number;
  colombia_specific_rate?: number;
  colombia_other_rate?: number;
  panama_indicator?: string;
  panama_rate_type_code?: string | number;
  panama_ad_val_rate?: number;
  panama_specific_rate?: number;
  panama_other_rate?: number;
  usmca_indicator?: string;
  usmca_rate_type_code?: string | number;
  usmca_ad_val_rate?: number;
  usmca_specific_rate?: number;
  usmca_other_rate?: number;
  
  requested_hts_code?: string;
  matched_hts_code?: string;
}

// Comprehensive country list with trade status
const COUNTRIES = [
  { code: "AD", name: "Andorra", ntr: true, gsp: false },
  { code: "AE", name: "United Arab Emirates", ntr: true, gsp: false },
  { code: "AF", name: "Afghanistan", ntr: true, gsp: true },
  { code: "AG", name: "Antigua and Barbuda", ntr: true, gsp: true },
  { code: "AI", name: "Anguilla", ntr: true, gsp: true },
  { code: "AL", name: "Albania", ntr: true, gsp: true },
  { code: "AM", name: "Armenia", ntr: true, gsp: true },
  { code: "AO", name: "Angola", ntr: true, gsp: true },
  { code: "AR", name: "Argentina", ntr: true, gsp: true },
  { code: "AS", name: "American Samoa", ntr: true, gsp: false },
  { code: "AT", name: "Austria", ntr: true, gsp: false },
  { code: "AU", name: "Australia", ntr: true, gsp: false },
  { code: "AW", name: "Aruba", ntr: true, gsp: false },
  { code: "AZ", name: "Azerbaijan", ntr: true, gsp: true },
  { code: "BA", name: "Bosnia and Herzegovina", ntr: true, gsp: true },
  { code: "BB", name: "Barbados", ntr: true, gsp: false },
  { code: "BD", name: "Bangladesh", ntr: true, gsp: true },
  { code: "BE", name: "Belgium", ntr: true, gsp: false },
  { code: "BF", name: "Burkina Faso", ntr: true, gsp: true },
  { code: "BG", name: "Bulgaria", ntr: true, gsp: false },
  { code: "BH", name: "Bahrain", ntr: true, gsp: false },
  { code: "BI", name: "Burundi", ntr: true, gsp: true },
  { code: "BJ", name: "Benin", ntr: true, gsp: true },
  { code: "BM", name: "Bermuda", ntr: true, gsp: false },
  { code: "BN", name: "Brunei", ntr: true, gsp: false },
  { code: "BO", name: "Bolivia", ntr: true, gsp: true },
  { code: "BR", name: "Brazil", ntr: true, gsp: true },
  { code: "BS", name: "Bahamas", ntr: true, gsp: false },
  { code: "BT", name: "Bhutan", ntr: true, gsp: true },
  { code: "BW", name: "Botswana", ntr: true, gsp: true },
  { code: "BY", name: "Belarus", ntr: false, gsp: false }, // Non-NTR
  { code: "BZ", name: "Belize", ntr: true, gsp: true },
  { code: "CA", name: "Canada", ntr: true, gsp: false },
  { code: "CD", name: "Democratic Republic of the Congo", ntr: true, gsp: true },
  { code: "CF", name: "Central African Republic", ntr: true, gsp: true },
  { code: "CG", name: "Republic of the Congo", ntr: true, gsp: true },
  { code: "CH", name: "Switzerland", ntr: true, gsp: false },
  { code: "CI", name: "Côte d'Ivoire", ntr: true, gsp: true },
  { code: "CK", name: "Cook Islands", ntr: true, gsp: true },
  { code: "CL", name: "Chile", ntr: true, gsp: false },
  { code: "CM", name: "Cameroon", ntr: true, gsp: true },
  { code: "CN", name: "China", ntr: true, gsp: false },
  { code: "CO", name: "Colombia", ntr: true, gsp: false },
  { code: "CR", name: "Costa Rica", ntr: true, gsp: false },
  { code: "CU", name: "Cuba", ntr: false, gsp: false }, // Non-NTR
  { code: "CV", name: "Cape Verde", ntr: true, gsp: true },
  { code: "CY", name: "Cyprus", ntr: true, gsp: false },
  { code: "CZ", name: "Czech Republic", ntr: true, gsp: false },
  { code: "DE", name: "Germany", ntr: true, gsp: false },
  { code: "DJ", name: "Djibouti", ntr: true, gsp: true },
  { code: "DK", name: "Denmark", ntr: true, gsp: false },
  { code: "DM", name: "Dominica", ntr: true, gsp: true },
  { code: "DO", name: "Dominican Republic", ntr: true, gsp: false },
  { code: "DZ", name: "Algeria", ntr: true, gsp: true },
  { code: "EC", name: "Ecuador", ntr: true, gsp: true },
  { code: "EE", name: "Estonia", ntr: true, gsp: false },
  { code: "EG", name: "Egypt", ntr: true, gsp: true },
  { code: "ER", name: "Eritrea", ntr: true, gsp: true },
  { code: "ES", name: "Spain", ntr: true, gsp: false },
  { code: "ET", name: "Ethiopia", ntr: true, gsp: true },
  { code: "FI", name: "Finland", ntr: true, gsp: false },
  { code: "FJ", name: "Fiji", ntr: true, gsp: true },
  { code: "FK", name: "Falkland Islands", ntr: true, gsp: true },
  { code: "FM", name: "Micronesia", ntr: true, gsp: true },
  { code: "FO", name: "Faroe Islands", ntr: true, gsp: false },
  { code: "FR", name: "France", ntr: true, gsp: false },
  { code: "GA", name: "Gabon", ntr: true, gsp: true },
  { code: "GB", name: "United Kingdom", ntr: true, gsp: false },
  { code: "GD", name: "Grenada", ntr: true, gsp: true },
  { code: "GE", name: "Georgia", ntr: true, gsp: true },
  { code: "GF", name: "French Guiana", ntr: true, gsp: false },
  { code: "GG", name: "Guernsey", ntr: true, gsp: false },
  { code: "GH", name: "Ghana", ntr: true, gsp: true },
  { code: "GI", name: "Gibraltar", ntr: true, gsp: false },
  { code: "GL", name: "Greenland", ntr: true, gsp: false },
  { code: "GM", name: "Gambia", ntr: true, gsp: true },
  { code: "GN", name: "Guinea", ntr: true, gsp: true },
  { code: "GP", name: "Guadeloupe", ntr: true, gsp: false },
  { code: "GQ", name: "Equatorial Guinea", ntr: true, gsp: true },
  { code: "GR", name: "Greece", ntr: true, gsp: false },
  { code: "GT", name: "Guatemala", ntr: true, gsp: false },
  { code: "GU", name: "Guam", ntr: true, gsp: false },
  { code: "GW", name: "Guinea-Bissau", ntr: true, gsp: true },
  { code: "GY", name: "Guyana", ntr: true, gsp: true },
  { code: "HK", name: "Hong Kong", ntr: true, gsp: false },
  { code: "HN", name: "Honduras", ntr: true, gsp: false },
  { code: "HR", name: "Croatia", ntr: true, gsp: false },
  { code: "HT", name: "Haiti", ntr: true, gsp: true },
  { code: "HU", name: "Hungary", ntr: true, gsp: false },
  { code: "ID", name: "Indonesia", ntr: true, gsp: true },
  { code: "IE", name: "Ireland", ntr: true, gsp: false },
  { code: "IL", name: "Israel", ntr: true, gsp: false },
  { code: "IM", name: "Isle of Man", ntr: true, gsp: false },
  { code: "IN", name: "India", ntr: true, gsp: true },
  { code: "IQ", name: "Iraq", ntr: true, gsp: true },
  { code: "IR", name: "Iran", ntr: true, gsp: false },
  { code: "IS", name: "Iceland", ntr: true, gsp: false },
  { code: "IT", name: "Italy", ntr: true, gsp: false },
  { code: "JE", name: "Jersey", ntr: true, gsp: false },
  { code: "JM", name: "Jamaica", ntr: true, gsp: true },
  { code: "JO", name: "Jordan", ntr: true, gsp: false },
  { code: "JP", name: "Japan", ntr: true, gsp: false },
  { code: "KE", name: "Kenya", ntr: true, gsp: true },
  { code: "KG", name: "Kyrgyzstan", ntr: true, gsp: true },
  { code: "KH", name: "Cambodia", ntr: true, gsp: true },
  { code: "KI", name: "Kiribati", ntr: true, gsp: true },
  { code: "KM", name: "Comoros", ntr: true, gsp: true },
  { code: "KN", name: "Saint Kitts and Nevis", ntr: true, gsp: true },
  { code: "KP", name: "North Korea", ntr: false, gsp: false }, // Non-NTR
  { code: "KR", name: "South Korea", ntr: true, gsp: false },
  { code: "KW", name: "Kuwait", ntr: true, gsp: false },
  { code: "KY", name: "Cayman Islands", ntr: true, gsp: false },
  { code: "KZ", name: "Kazakhstan", ntr: true, gsp: true },
  { code: "LA", name: "Laos", ntr: true, gsp: true },
  { code: "LB", name: "Lebanon", ntr: true, gsp: true },
  { code: "LC", name: "Saint Lucia", ntr: true, gsp: true },
  { code: "LI", name: "Liechtenstein", ntr: true, gsp: false },
  { code: "LK", name: "Sri Lanka", ntr: true, gsp: true },
  { code: "LR", name: "Liberia", ntr: true, gsp: true },
  { code: "LS", name: "Lesotho", ntr: true, gsp: true },
  { code: "LT", name: "Lithuania", ntr: true, gsp: false },
  { code: "LU", name: "Luxembourg", ntr: true, gsp: false },
  { code: "LV", name: "Latvia", ntr: true, gsp: false },
  { code: "LY", name: "Libya", ntr: true, gsp: true },
  { code: "MA", name: "Morocco", ntr: true, gsp: false },
  { code: "MC", name: "Monaco", ntr: true, gsp: false },
  { code: "MD", name: "Moldova", ntr: true, gsp: true },
  { code: "ME", name: "Montenegro", ntr: true, gsp: true },
  { code: "MG", name: "Madagascar", ntr: true, gsp: true },
  { code: "MH", name: "Marshall Islands", ntr: true, gsp: true },
  { code: "MK", name: "North Macedonia", ntr: true, gsp: true },
  { code: "ML", name: "Mali", ntr: true, gsp: true },
  { code: "MM", name: "Myanmar", ntr: true, gsp: true },
  { code: "MN", name: "Mongolia", ntr: true, gsp: true },
  { code: "MO", name: "Macao", ntr: true, gsp: false },
  { code: "MP", name: "Northern Mariana Islands", ntr: true, gsp: false },
  { code: "MQ", name: "Martinique", ntr: true, gsp: false },
  { code: "MR", name: "Mauritania", ntr: true, gsp: true },
  { code: "MS", name: "Montserrat", ntr: true, gsp: true },
  { code: "MT", name: "Malta", ntr: true, gsp: false },
  { code: "MU", name: "Mauritius", ntr: true, gsp: true },
  { code: "MV", name: "Maldives", ntr: true, gsp: true },
  { code: "MW", name: "Malawi", ntr: true, gsp: true },
  { code: "MX", name: "Mexico", ntr: true, gsp: false },
  { code: "MY", name: "Malaysia", ntr: true, gsp: false },
  { code: "MZ", name: "Mozambique", ntr: true, gsp: true },
  { code: "NA", name: "Namibia", ntr: true, gsp: true },
  { code: "NC", name: "New Caledonia", ntr: true, gsp: false },
  { code: "NE", name: "Niger", ntr: true, gsp: true },
  { code: "NF", name: "Norfolk Island", ntr: true, gsp: true },
  { code: "NG", name: "Nigeria", ntr: true, gsp: true },
  { code: "NI", name: "Nicaragua", ntr: true, gsp: false },
  { code: "NL", name: "Netherlands", ntr: true, gsp: false },
  { code: "NO", name: "Norway", ntr: true, gsp: false },
  { code: "NP", name: "Nepal", ntr: true, gsp: true },
  { code: "NR", name: "Nauru", ntr: true, gsp: true },
  { code: "NU", name: "Niue", ntr: true, gsp: true },
  { code: "NZ", name: "New Zealand", ntr: true, gsp: false },
  { code: "OM", name: "Oman", ntr: true, gsp: false },
  { code: "PA", name: "Panama", ntr: true, gsp: false },
  { code: "PE", name: "Peru", ntr: true, gsp: false },
  { code: "PF", name: "French Polynesia", ntr: true, gsp: false },
  { code: "PG", name: "Papua New Guinea", ntr: true, gsp: true },
  { code: "PH", name: "Philippines", ntr: true, gsp: true },
  { code: "PK", name: "Pakistan", ntr: true, gsp: true },
  { code: "PL", name: "Poland", ntr: true, gsp: false },
  { code: "PM", name: "Saint Pierre and Miquelon", ntr: true, gsp: false },
  { code: "PN", name: "Pitcairn Islands", ntr: true, gsp: true },
  { code: "PR", name: "Puerto Rico", ntr: true, gsp: false },
  { code: "PS", name: "Palestine", ntr: true, gsp: true },
  { code: "PT", name: "Portugal", ntr: true, gsp: false },
  { code: "PW", name: "Palau", ntr: true, gsp: true },
  { code: "PY", name: "Paraguay", ntr: true, gsp: true },
  { code: "QA", name: "Qatar", ntr: true, gsp: false },
  { code: "RE", name: "Réunion", ntr: true, gsp: false },
  { code: "RO", name: "Romania", ntr: true, gsp: false },
  { code: "RS", name: "Serbia", ntr: true, gsp: true },
  { code: "RU", name: "Russia", ntr: false, gsp: false }, // Non-NTR
  { code: "RW", name: "Rwanda", ntr: true, gsp: true },
  { code: "SA", name: "Saudi Arabia", ntr: true, gsp: false },
  { code: "SB", name: "Solomon Islands", ntr: true, gsp: true },
  { code: "SC", name: "Seychelles", ntr: true, gsp: true },
  { code: "SD", name: "Sudan", ntr: true, gsp: true },
  { code: "SE", name: "Sweden", ntr: true, gsp: false },
  { code: "SG", name: "Singapore", ntr: true, gsp: false },
  { code: "SH", name: "Saint Helena", ntr: true, gsp: true },
  { code: "SI", name: "Slovenia", ntr: true, gsp: false },
  { code: "SK", name: "Slovakia", ntr: true, gsp: false },
  { code: "SL", name: "Sierra Leone", ntr: true, gsp: true },
  { code: "SM", name: "San Marino", ntr: true, gsp: false },
  { code: "SN", name: "Senegal", ntr: true, gsp: true },
  { code: "SO", name: "Somalia", ntr: true, gsp: true },
  { code: "SR", name: "Suriname", ntr: true, gsp: true },
  { code: "SS", name: "South Sudan", ntr: true, gsp: true },
  { code: "ST", name: "São Tomé and Príncipe", ntr: true, gsp: true },
  { code: "SV", name: "El Salvador", ntr: true, gsp: false },
  { code: "SY", name: "Syria", ntr: true, gsp: false },
  { code: "SZ", name: "Eswatini", ntr: true, gsp: true },
  { code: "TC", name: "Turks and Caicos Islands", ntr: true, gsp: false },
  { code: "TD", name: "Chad", ntr: true, gsp: true },
  { code: "TG", name: "Togo", ntr: true, gsp: true },
  { code: "TH", name: "Thailand", ntr: true, gsp: true },
  { code: "TJ", name: "Tajikistan", ntr: true, gsp: true },
  { code: "TK", name: "Tokelau", ntr: true, gsp: true },
  { code: "TL", name: "Timor-Leste", ntr: true, gsp: true },
  { code: "TM", name: "Turkmenistan", ntr: true, gsp: true },
  { code: "TN", name: "Tunisia", ntr: true, gsp: true },
  { code: "TO", name: "Tonga", ntr: true, gsp: true },
  { code: "TR", name: "Turkey", ntr: true, gsp: true },
  { code: "TT", name: "Trinidad and Tobago", ntr: true, gsp: true },
  { code: "TV", name: "Tuvalu", ntr: true, gsp: true },
  { code: "TW", name: "Taiwan", ntr: true, gsp: false },
  { code: "TZ", name: "Tanzania", ntr: true, gsp: true },
  { code: "UA", name: "Ukraine", ntr: true, gsp: true },
  { code: "UG", name: "Uganda", ntr: true, gsp: true },
  { code: "US", name: "United States", ntr: true, gsp: false },
  { code: "UY", name: "Uruguay", ntr: true, gsp: true },
  { code: "UZ", name: "Uzbekistan", ntr: true, gsp: true },
  { code: "VA", name: "Vatican City", ntr: true, gsp: false },
  { code: "VC", name: "Saint Vincent and the Grenadines", ntr: true, gsp: true },
  { code: "VE", name: "Venezuela", ntr: true, gsp: true },
  { code: "VG", name: "British Virgin Islands", ntr: true, gsp: true },
  { code: "VI", name: "U.S. Virgin Islands", ntr: true, gsp: false },
  { code: "VN", name: "Vietnam", ntr: true, gsp: true },
  { code: "VU", name: "Vanuatu", ntr: true, gsp: true },
  { code: "WF", name: "Wallis and Futuna", ntr: true, gsp: true },
  { code: "WS", name: "Samoa", ntr: true, gsp: true },
  { code: "YE", name: "Yemen", ntr: true, gsp: true },
  { code: "YT", name: "Mayotte", ntr: true, gsp: false },
  { code: "ZA", name: "South Africa", ntr: true, gsp: true },
  { code: "ZM", name: "Zambia", ntr: true, gsp: true },
  { code: "ZW", name: "Zimbabwe", ntr: true, gsp: true }
];

// Rate type code meanings
const RATE_TYPE_CODES = {
  0: 'Free',
  1: 'Ad Valorem',
  2: 'Specific',
  3: 'Compound',
  4: 'Other',
  5: 'Mixed',
  6: 'Formula',
  7: 'Ad Valorem', // Most common
  8: 'Specific with ad valorem minimum'
};

// Complete program symbol to country/region mapping
const PROGRAM_SYMBOL_TO_COUNTRIES = {
  'A*': 'GSP_eligible_except_excluded',
  'A': 'GSP_all_eligible',
  'A+': 'GSP_least_developed',
  'AU': ['AU'],
  'BH': ['BH'],
  'CA': ['CA'],
  'CL': ['CL'],
  'CO': ['CO'],
  'D': ['ZA', 'KE', 'GH', 'NG', 'ET', 'TZ', 'UG', 'RW', 'BW', 'MU', 'MG', 'SN', 'CI', 'CM', 'BF', 'ML', 'NE', 'TD', 'CF', 'CG', 'GA', 'GQ', 'ST', 'CV', 'GM', 'GN', 'GW', 'LR', 'SL', 'TG', 'BJ', 'BI', 'DJ', 'ER', 'SO', 'SS', 'KM', 'MZ', 'ZM', 'ZW', 'MW', 'LS', 'SZ', 'NA', 'AO'], // AGOA countries
  'E': ['AG', 'BB', 'BZ', 'CR', 'DM', 'DO', 'SV', 'GD', 'GT', 'GY', 'HT', 'HN', 'JM', 'MS', 'NI', 'PA', 'KN', 'LC', 'VC', 'TT'], // CBI countries
  'IL': ['IL'],
  'JO': ['JO'],
  'KR': ['KR'],
  'MA': ['MA'],
  'MX': ['MX'],
  'OM': ['OM'],
  'P': ['CR', 'DO', 'SV', 'GT', 'HN', 'NI'], // CAFTA-DR countries
  'PA': ['PA'],
  'PE': ['PE'],
  'S': ['CA', 'MX'], // USMCA countries
  'SG': ['SG']
};

// Program definitions with complete information
const TRADE_PROGRAMS = [
  {
    key: 'gsp_indicator',
    symbol: 'A*',
    label: 'GSP (Generalized System of Preferences)',
    rateField: null,
    description: 'Developing country preference program',
    requirements: ['GSP eligible country', 'Product not excluded', '35% value-added rule'],
    excludedField: 'gsp_ctry_excluded'
  },
  {
    key: 'agoa_indicator',
    symbol: 'D',
    label: 'AGOA (African Growth and Opportunity Act)',
    rateField: null,
    description: 'Sub-Saharan African trade preference',
    requirements: ['AGOA eligible country', 'Product eligible under AGOA', 'Rules of origin compliance']
  },
  {
    key: 'cbi_indicator',
    symbol: 'E',
    label: 'CBI (Caribbean Basin Initiative)',
    rateField: 'cbi_ad_val_rate',
    description: 'Caribbean and Central American preference',
    requirements: ['CBI eligible country', 'Product not excluded', '35% value-added rule']
  },
  {
    key: 'usmca_indicator',
    symbol: 'S',
    label: 'USMCA (US-Mexico-Canada Agreement)',
    rateField: 'usmca_ad_val_rate',
    description: 'North American free trade agreement',
    requirements: ['Originating in USMCA territory', 'Certificate of origin', 'Rules of origin compliance']
  },
  {
    key: 'australia_indicator',
    symbol: 'AU',
    label: 'US-Australia FTA',
    rateField: 'australia_ad_val_rate',
    description: 'US-Australia Free Trade Agreement',
    requirements: ['Australian origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'bahrain_indicator',
    symbol: 'BH',
    label: 'US-Bahrain FTA',
    rateField: 'bahrain_ad_val_rate',
    description: 'US-Bahrain Free Trade Agreement',
    requirements: ['Bahraini origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'chile_indicator',
    symbol: 'CL',
    label: 'US-Chile FTA',
    rateField: 'chile_ad_val_rate',
    description: 'US-Chile Free Trade Agreement',
    requirements: ['Chilean origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'colombia_indicator',
    symbol: 'CO',
    label: 'US-Colombia FTA',
    rateField: 'colombia_ad_val_rate',
    description: 'US-Colombia Trade Promotion Agreement',
    requirements: ['Colombian origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'dr_cafta_indicator',
    symbol: 'P',
    label: 'CAFTA-DR',
    rateField: 'dr_cafta_ad_val_rate',
    description: 'Central America-Dominican Republic FTA',
    requirements: ['CAFTA-DR country origin', 'Certificate of origin', 'Rules of origin compliance']
  },
  {
    key: 'israel_fta_indicator',
    symbol: 'IL',
    label: 'US-Israel FTA',
    rateField: null,
    description: 'US-Israel Free Trade Agreement',
    requirements: ['Israeli origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'jordan_indicator',
    symbol: 'JO',
    label: 'US-Jordan FTA',
    rateField: 'jordan_ad_val_rate',
    description: 'US-Jordan Free Trade Agreement',
    requirements: ['Jordanian origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'korea_indicator',
    symbol: 'KR',
    label: 'US-Korea FTA',
    rateField: 'korea_ad_val_rate',
    description: 'US-Korea Free Trade Agreement',
    requirements: ['Korean origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'morocco_indicator',
    symbol: 'MA',
    label: 'US-Morocco FTA',
    rateField: 'morocco_ad_val_rate',
    description: 'US-Morocco Free Trade Agreement',
    requirements: ['Moroccan origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'oman_indicator',
    symbol: 'OM',
    label: 'US-Oman FTA',
    rateField: 'oman_ad_val_rate',
    description: 'US-Oman Free Trade Agreement',
    requirements: ['Omani origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'panama_indicator',
    symbol: 'PA',
    label: 'US-Panama FTA',
    rateField: 'panama_ad_val_rate',
    description: 'US-Panama Trade Promotion Agreement',
    requirements: ['Panamanian origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'peru_indicator',
    symbol: 'PE',
    label: 'US-Peru FTA',
    rateField: 'peru_ad_val_rate',
    description: 'US-Peru Trade Promotion Agreement',
    requirements: ['Peruvian origin', 'Certificate of origin', 'Direct shipment']
  },
  {
    key: 'singapore_indicator',
    symbol: 'SG',
    label: 'US-Singapore FTA',
    rateField: 'singapore_ad_val_rate',
    description: 'US-Singapore Free Trade Agreement',
    requirements: ['Singaporean origin', 'Certificate of origin', 'Direct shipment']
  }
] as const;

// VAT rates by country
const COUNTRY_VAT_RATES = {
  'AT': 20, 'BE': 21, 'BG': 20, 'HR': 25, 'CY': 19, 'CZ': 21, 'DK': 25, 'EE': 20,
  'FI': 24, 'FR': 20, 'DE': 19, 'GR': 24, 'HU': 27, 'IE': 23, 'IT': 22, 'LV': 21,
  'LT': 21, 'LU': 17, 'MT': 18, 'NL': 21, 'PL': 23, 'PT': 23, 'RO': 19, 'SK': 20,
  'SI': 22, 'ES': 21, 'SE': 25, 'GB': 20, 'CA': 5, 'AU': 10, 'NZ': 15, 'JP': 10,
  'SG': 7, 'CH': 7.7, 'NO': 25, 'IS': 24, 'TR': 18, 'MX': 16, 'KR': 10, 'IN': 18,
  'BR': 17, 'CN': 13, 'ZA': 15, 'RU': 20, 'MY': 6, 'TH': 7, 'ID': 11, 'PH': 12,
  'VN': 10, 'EG': 14, 'MA': 20, 'KE': 16, 'NG': 7.5, 'GH': 12.5, 'UG': 18
};

const TariffCalculator: React.FC<TariffCalculatorProps> = ({ initialHsCode = "" }) => {
  const { userId } = useAuth();
  const [hsCode, setHsCode] = useState(initialHsCode);
  const [tariffData, setTariffData] = useState<TariffData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(initialHsCode ? 2 : 1);
  
  // Past classifications state
  const [pastClassifications, setPastClassifications] = useState<ClassificationRecord[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hsCodeInput, setHsCodeInput] = useState(initialHsCode);

  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails>({
    hsCode: initialHsCode,
    description: "",
    invoiceValue: "",
    freightCost: "",
    insuranceCost: "",
    quantity: "1",
    weight: "",
    countryOfOrigin: "",
    destinationCountry: "",
    vatRate: "",
    additionalFees: "",
    isFtaOriginCompliant: true,
  });

  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  // Helper functions
  const isNonNTRCountry = (countryCode: string): boolean => {
    const country = COUNTRIES.find(c => c.code === countryCode.toUpperCase());
    return country ? !country.ntr : false;
  };

  const isGSPEligible = (countryCode: string): boolean => {
    const country = COUNTRIES.find(c => c.code === countryCode.toUpperCase());
    return country ? country.gsp : false;
  };

  // Parse col1_special_text to extract eligible program symbols
  const parseEligiblePrograms = (specialText: string): string[] => {
    if (!specialText) return [];
    
    // Handle "Free (A*,AU,BH,CL,CO,D,E,IL,JO,KR,MA,OM,P,PA,PE,S,SG)" format
    const match = specialText.match(/Free\s*\(([^)]+)\)/i) || specialText.match(/\(([^)]+)\)/);
    if (!match) return [];
    
    return match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  // Check if a country is eligible for a specific program symbol
  const isCountryEligibleForSymbol = (countryCode: string, symbol: string, tariffData: TariffData): boolean => {
    const upperCountry = countryCode.toUpperCase();
    
    // Handle GSP symbols
    if (symbol === 'A*' || symbol === 'A') {
      // Check basic GSP eligibility
      if (!isGSPEligible(upperCountry)) return false;
      
      // Check country exclusions for this specific product
      const excluded = tariffData.gsp_ctry_excluded || '';
      if (excluded.includes(upperCountry)) return false;
      
      return true;
    }
    
    // Handle specific country/region symbols
    if (PROGRAM_SYMBOL_TO_COUNTRIES[symbol as keyof typeof PROGRAM_SYMBOL_TO_COUNTRIES]) {
      const eligibleCountries = PROGRAM_SYMBOL_TO_COUNTRIES[symbol as keyof typeof PROGRAM_SYMBOL_TO_COUNTRIES];
      
      if (Array.isArray(eligibleCountries)) {
        return eligibleCountries.includes(upperCountry);
      }
    }
    
    return false;
  };

  // Get rate information for a program
  const getProgramRate = (program: typeof TRADE_PROGRAMS[0], tariffData: TariffData) => {
    // Get rate type code
    const rateTypeField = `${program.key.replace('_indicator', '')}_rate_type_code`;
    const rateTypeCode = tariffData[rateTypeField as keyof TariffData] as number | string;
    
    // If rate type is 0, it's free
    if (rateTypeCode === 0 || rateTypeCode === '0') {
      return { rate: 0, type: 'Free', description: 'Duty-free under ' + program.label };
    }
    
    // Get the appropriate rate field
    if (program.rateField) {
      const adValRate = tariffData[program.rateField as keyof TariffData] as number;
      const specificRateField = program.rateField.replace('ad_val_rate', 'specific_rate');
      const specificRate = tariffData[specificRateField as keyof TariffData] as number;
      const otherRateField = program.rateField.replace('ad_val_rate', 'other_rate');
      const otherRate = tariffData[otherRateField as keyof TariffData] as number;
      
      if (specificRate > 0) {
        return { rate: specificRate, type: 'Specific', description: `$${specificRate} per unit under ${program.label}` };
      } else if (adValRate > 0) {
        return { rate: adValRate, type: 'Ad Valorem', description: `${(adValRate * 100).toFixed(2)}% under ${program.label}` };
      } else if (otherRate > 0) {
        return { rate: otherRate, type: 'Other', description: `Special rate under ${program.label}` };
      }
    }
    
    return { rate: 0, type: 'Free', description: 'Duty-free under ' + program.label };
  };

  // Calculate the best applicable duty rate
  const calculateBestDutyRate = (tariffData: TariffData, originCountry: string, quantity: number, weight: number) => {
    const eligibleSymbols = parseEligiblePrograms(tariffData.col1_special_text || '');
    console.log('Eligible symbols from col1_special_text:', eligibleSymbols);
    
    let bestRate = null;
    let bestProgram = null;
    let eligiblePrograms: EligibleProgram[] = [];
    
    // Check each eligible symbol
    for (const symbol of eligibleSymbols) {
      // Find the program that matches this symbol
      const program = TRADE_PROGRAMS.find(p => p.symbol === symbol);
      
      if (program && isCountryEligibleForSymbol(originCountry, symbol, tariffData)) {
        const rateInfo = getProgramRate(program, tariffData);
        
        eligiblePrograms.push({
          name: program.label,
          symbol: symbol,
          rate: rateInfo.rate,
          rateType: rateInfo.type,
          description: rateInfo.description,
          requirements: program.requirements || []
        });
        
        // Track the best (lowest) rate
        if (bestRate === null || rateInfo.rate < bestRate.rate) {
          bestRate = rateInfo;
          bestProgram = program;
        }
      }
    }
    
    // If no preferential rate found, use MFN or Column 2
    if (bestRate === null) {
      if (isNonNTRCountry(originCountry)) {
        // Use Column 2 rates
        const col2Rate = tariffData.col2_ad_val_rate || 0;
        bestRate = {
          rate: col2Rate,
          type: 'Ad Valorem',
          description: `${(col2Rate * 100).toFixed(2)}% (Column 2 - Non-NTR country)`
        };
      } else {
        // Use MFN rates
        const mfnRate = tariffData.mfn_ad_val_rate || 0;
        const mfnSpecific = tariffData.mfn_specific_rate || 0;
        
        if (mfnSpecific > 0 && (tariffData.quantity_1_code === 'KG' || tariffData.mfn_text_rate?.includes('kg'))) {
          bestRate = {
            rate: mfnSpecific,
            type: 'Specific',
            description: `$${mfnSpecific} per kg (MFN rate)`
          };
        } else {
          bestRate = {
            rate: mfnRate,
            type: 'Ad Valorem',
            description: `${(mfnRate * 100).toFixed(2)}% (MFN rate)`
          };
        }
      }
    }
    
    return {
      bestRate,
      bestProgram,
      eligiblePrograms,
      standardMfnRate: tariffData.mfn_ad_val_rate || 0
    };
  };

  // Load past classifications on mount
  useEffect(() => {
    if (userId) {
      loadPastClassifications();
    }
  }, [userId]);

  // Fetch tariff data when HS code changes
  useEffect(() => {
    if (hsCode && hsCode.length >= 6) {
      fetchTariffData(hsCode);
    }
  }, [hsCode]);

  // Auto-populate VAT rate when destination country changes
  useEffect(() => {
    if (shipmentDetails.destinationCountry) {
      const vatRate = COUNTRY_VAT_RATES[shipmentDetails.destinationCountry as keyof typeof COUNTRY_VAT_RATES];
      if (vatRate) {
        setShipmentDetails(prev => ({
          ...prev,
          vatRate: vatRate
        }));
      }
    }
  }, [shipmentDetails.destinationCountry]);

  const loadPastClassifications = async () => {
    if (!userId) return;
    try {
      const classifications = await getUserClassifications(userId, 20);
      setPastClassifications(classifications);
    } catch (error) {
      console.error('Error loading past classifications:', error);
    }
  };

  const selectHsCode = (code: string, description?: string) => {
    setHsCode(code);
    setHsCodeInput(code);
    setShowDropdown(false);
    if (description) {
      setShipmentDetails(prev => ({
        ...prev,
        description
      }));
    }
  };

  const filteredClassifications = pastClassifications.filter(c => 
    c.hs_code.toLowerCase().includes(hsCodeInput.toLowerCase()) ||
    c.product_description.toLowerCase().includes(hsCodeInput.toLowerCase())
  );

  const fetchTariffData = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching tariff data for HS code:", code);
      const data = await getTariffInfo(code);
      console.log("Received tariff data:", data);
      
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid tariff data received");
      }
      
      setTariffData(data);

      if (data?.brief_description) {
        setShipmentDetails(prev => ({
          ...prev,
          description: data.brief_description || prev.description,
          hsCode: code
        }));
      }

      setLoading(false);
    } catch (err: any) {
      setError(`Failed to fetch tariff information: ${err.message}`);
      setLoading(false);
      console.error("Error fetching tariff data:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setShipmentDetails(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (["invoiceValue", "freightCost", "insuranceCost", "quantity", "weight", "vatRate", "additionalFees"].includes(name)) {
      const numericValue = value === "" ? "" : String(parseFloat(value) || 0);
      setShipmentDetails(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setShipmentDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Check if weight is required for calculation
  const isWeightRequiredForCalculation = (): boolean => {
    if (!tariffData) return false;
    return tariffData.quantity_1_code === 'KG' || 
           (tariffData.mfn_text_rate && tariffData.mfn_text_rate.toString().toLowerCase().includes('kg'));
  };

  // Calculate tariff with enhanced accuracy
  const calculateTariff = () => {
    const invoiceValue = parseFloat(shipmentDetails.invoiceValue as string) || 0;
    const freightCost = parseFloat(shipmentDetails.freightCost as string) || 0;
    const insuranceCost = parseFloat(shipmentDetails.insuranceCost as string) || 0;
    const vatRate = parseFloat(shipmentDetails.vatRate as string) || 0;
    const additionalFees = parseFloat(shipmentDetails.additionalFees as string) || 0;
    const quantity = parseFloat(shipmentDetails.quantity as string) || 1;
    const weight = parseFloat(shipmentDetails.weight as string) || 0;

    if (!tariffData || !invoiceValue) {
      setError("Missing required information. Please ensure you've entered an HS code and invoice value.");
      return;
    }

    console.log("Starting enhanced calculation with:", {
      invoiceValue, freightCost, insuranceCost, vatRate, additionalFees, quantity, weight, tariffData
    });

    // Step 1: Calculate CIF Value
    const cifValue = invoiceValue + freightCost + insuranceCost;

    // Step 2: Get best applicable duty rate
    const rateAnalysis = calculateBestDutyRate(tariffData, shipmentDetails.countryOfOrigin, quantity, weight);
    
    let dutyAmount = 0;
    let dutyRateDescription = "";
    let warnings: string[] = [];
    
    // Calculate duty based on rate type
    if (rateAnalysis.bestRate.type === 'Free') {
      dutyAmount = 0;
      dutyRateDescription = rateAnalysis.bestRate.description;
    } else if (rateAnalysis.bestRate.type === 'Specific') {
      const unitQuantity = isWeightRequiredForCalculation() ? weight : quantity;
      dutyAmount = rateAnalysis.bestRate.rate * unitQuantity;
      dutyRateDescription = rateAnalysis.bestRate.description;
      
      if (isWeightRequiredForCalculation() && !weight) {
        warnings.push("Weight is required for accurate calculation of specific duties");
      }
    } else {
      // Ad Valorem rate
      dutyAmount = cifValue * rateAnalysis.bestRate.rate;
      dutyRateDescription = rateAnalysis.bestRate.description;
    }

    // Check FTA compliance
    if (rateAnalysis.bestProgram && !shipmentDetails.isFtaOriginCompliant) {
      warnings.push(`You've indicated non-compliance with FTA origin rules. This may affect your eligibility for ${rateAnalysis.bestProgram.label} benefits.`);
    }

    // Step 3: Calculate VAT Base and VAT
    const vatBase = cifValue + dutyAmount + additionalFees;
    const vatAmount = vatBase * (vatRate / 100);

    // Step 4: Calculate Total Payable
    const totalPayable = cifValue + dutyAmount + vatAmount + additionalFees;

    // Calculate effective duty rate
    const effectiveDutyRate = cifValue > 0 ? (totalPayable / cifValue) : 0;

    // Calculate potential savings
    let potentialSavings = undefined;
    if (rateAnalysis.bestProgram && rateAnalysis.standardMfnRate > 0) {
      const standardDuty = cifValue * rateAnalysis.standardMfnRate;
      const savings = standardDuty - dutyAmount;
      if (savings > 0) {
        potentialSavings = {
          standardDuty,
          appliedDuty: dutyAmount,
          savings,
          programUsed: rateAnalysis.bestProgram.label
        };
      }
    }

    // Validate calculation dates
    if (tariffData.end_effective_date) {
      const endDate = new Date(tariffData.end_effective_date);
      const now = new Date();
      if (endDate < now) {
        warnings.push("The tariff rates used in this calculation may be outdated. Please verify current rates.");
      }
    }

    // Create detailed breakdown
    const breakdown = [
      {
        label: "Invoice Value",
        value: invoiceValue,
        description: "Commercial value of goods"
      },
      {
        label: "Freight Cost",
        value: freightCost,
        description: "Transportation costs"
      },
      {
        label: "Insurance Cost",
        value: insuranceCost,
        description: "Insurance during transit"
      },
      {
        label: "CIF Value",
        value: cifValue,
        description: "Cost, Insurance, and Freight (Customs value)",
        isHighlight: true
      },
      {
        label: "Import Duty",
        value: dutyAmount,
        description: dutyRateDescription,
        isHighlight: true
      },
      {
        label: "Additional Fees",
        value: additionalFees,
        description: "Processing fees, handling charges, etc."
      },
      {
        label: "VAT Base",
        value: vatBase,
        description: `CIF + Duty + Additional Fees = ${formatCurrency(vatBase)}`
      },
      {
        label: "VAT",
        value: vatAmount,
        description: `${vatRate}% of VAT base`,
        isHighlight: true
      },
      {
        label: "Total Payable",
        value: totalPayable,
        description: "Total amount due at customs",
        isHighlight: true
      }
    ];

    setCalculationResult({
      cifValue,
      dutyAmount,
      vatBase,
      vatAmount,
      totalPayable,
      effectiveDutyRate,
      breakdown,
      dutyRateUsed: dutyRateDescription,
      programApplied: rateAnalysis.bestProgram?.label,
      rateSource: rateAnalysis.bestProgram ? 'Preferential' : (isNonNTRCountry(shipmentDetails.countryOfOrigin) ? 'Column 2' : 'MFN'),
      potentialSavings,
      warnings,
      eligiblePrograms: rateAnalysis.eligiblePrograms
    });

    setStep(4);
  };

  // Format currency values
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  // Format percentage values
  const formatPercentage = (value: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  // Render step 1: HS Code input
  const renderHSCodeStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3">Enter HS Code</h2>
        <p className="text-muted-foreground">
          Start by entering the Harmonized System (HS) code for your product
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="hsCode" className="text-sm font-medium">
            HS Code
          </label>
          <div className="relative">
            <input
              id="hsCode"
              type="text"
              value={hsCodeInput}
              onChange={(e) => {
                setHsCodeInput(e.target.value);
                setHsCode(e.target.value);
                setShowDropdown(e.target.value.length > 0 && pastClassifications.length > 0);
              }}
              onFocus={() => setShowDropdown(pastClassifications.length > 0)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Enter 6-10 digit HS code or search past classifications"
              className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {pastClassifications.length > 0 && (
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showDropdown && "rotate-180")} />
              )}
            </div>
            
            {/* Dropdown for past classifications */}
            {showDropdown && filteredClassifications.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 border-b border-border">
                  <p className="text-xs text-muted-foreground font-medium">Recent Classifications</p>
                </div>
                {filteredClassifications.slice(0, 10).map((classification) => (
                  <div
                    key={classification.id}
                    onClick={() => selectHsCode(classification.hs_code, classification.product_description)}
                    className="p-3 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-medium text-sm">{classification.hs_code}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {classification.product_description}
                        </p>
                      </div>
                      {classification.is_favorite && (
                        <div className="ml-2 text-yellow-500">
                          <Package className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Tariff Rate Display */}
        {tariffData && hsCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-800 mb-2">Tariff Information Found</h4>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-green-700">
                        <strong>HS Code:</strong> {hsCode}
                        {tariffData.matched_hts_code !== tariffData.requested_hts_code && (
                          <span className="text-orange-600 ml-2">(Matched: {tariffData.matched_hts_code})</span>
                        )}
                      </p>
                      {tariffData.brief_description && (
                        <p className="text-green-700 mt-1">
                          <strong>Description:</strong> {tariffData.brief_description}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-green-700">
                        <strong>MFN Duty Rate:</strong> {tariffData.mfn_text_rate || 'Free'}
                      </p>
                      {tariffData.col1_special_text && (
                        <p className="text-green-700 mt-1">
                          <strong>Special Programs:</strong> {tariffData.col1_special_text}
                        </p>
                      )}
                    </div>
                  </div>
                  {parseEligiblePrograms(tariffData.col1_special_text || '').length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
                      <p className="text-blue-800 text-xs">
                        <strong>Available Programs:</strong> {parseEligiblePrograms(tariffData.col1_special_text || '').join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <CustomButton
            onClick={() => {
              if (hsCode && hsCode.length >= 6) {
                setStep(2);
              } else {
                setError("Please enter a valid HS code (at least 6 digits)");
              }
            }}
            disabled={loading || !hsCode || hsCode.length < 6}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Tariff Data...
              </>
            ) : (
              "Continue to Shipment Details"
            )}
          </CustomButton>
        </div>
      </div>
    </div>
  );

  // Render step 2: Enhanced shipment details
  const renderProductDetailsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3">Shipment Details</h2>
        <p className="text-muted-foreground">
          Enter details about your shipment and countries
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <label htmlFor="countryOfOrigin" className="text-sm font-medium">
              Country of Origin <span className="text-red-500">*</span>
            </label>
            <select
              id="countryOfOrigin"
              name="countryOfOrigin"
              value={shipmentDetails.countryOfOrigin}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select country of origin</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                  {!country.ntr && ' - Non-NTR'}
                  {country.gsp && ' - GSP Eligible'}
                </option>
              ))}
            </select>
            {shipmentDetails.countryOfOrigin && (
              <div className="text-xs space-y-1">
                {isNonNTRCountry(shipmentDetails.countryOfOrigin) && (
                  <p className="text-red-600">⚠️ Non-NTR country - Higher duty rates apply</p>
                )}
                {isGSPEligible(shipmentDetails.countryOfOrigin) && (
                  <p className="text-green-600">✓ GSP eligible country</p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="destinationCountry" className="text-sm font-medium">
              Destination Country <span className="text-red-500">*</span>
            </label>
            <select
              id="destinationCountry"
              name="destinationCountry"
              value={shipmentDetails.destinationCountry}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select destination country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <label htmlFor="invoiceValue" className="text-sm font-medium">
              Invoice Value (USD) <span className="text-red-500">*</span>
            </label>
            <input
              id="invoiceValue"
              name="invoiceValue"
              type="number"
              min="0"
              step="0.01"
              value={shipmentDetails.invoiceValue}
              onChange={handleInputChange}
              placeholder="Enter invoice value"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="freightCost" className="text-sm font-medium">
              Freight Cost (USD)
            </label>
            <input
              id="freightCost"
              name="freightCost"
              type="number"
              min="0"
              step="0.01"
              value={shipmentDetails.freightCost}
              onChange={handleInputChange}
              placeholder="Enter freight cost"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <label htmlFor="insuranceCost" className="text-sm font-medium">
              Insurance Cost (USD)
            </label>
            <input
              id="insuranceCost"
              name="insuranceCost"
              type="number"
              min="0"
              step="0.01"
              value={shipmentDetails.insuranceCost}
              onChange={handleInputChange}
              placeholder="Enter insurance cost"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="quantity" className="text-sm font-medium flex items-center">
              Quantity
              {tariffData?.quantity_1_code && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  Unit: {tariffData.quantity_1_code}
                </span>
              )}
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={shipmentDetails.quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {isWeightRequiredForCalculation() && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <label htmlFor="weight" className="text-sm font-medium flex items-center">
                Weight (kg)
                <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                  Required for this HS code
                </span>
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                min="0"
                step="0.01"
                value={shipmentDetails.weight}
                onChange={handleInputChange}
                placeholder="Enter weight in kg"
                className="flex h-10 w-full rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Weight is required because this HS code has weight-based duty rates
              </p>
            </div>
            <div></div>
          </div>
        )}

        {/* FTA Origin Compliance */}
        {tariffData && parseEligiblePrograms(tariffData.col1_special_text || '').some(symbol => symbol !== 'A*' && symbol !== 'A') && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3">Free Trade Agreement Compliance</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isFtaOriginCompliant"
                  checked={shipmentDetails.isFtaOriginCompliant}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-blue-800">
                  Product meets FTA origin requirements and rules of origin
                </span>
              </label>
              <p className="text-xs text-blue-600">
                Check this box if your product qualifies for FTA benefits (certificate of origin, value-added requirements, etc.)
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <CustomButton variant="outline" onClick={() => setStep(1)}>
            Back
          </CustomButton>
          <CustomButton
            onClick={() => {
              if (!shipmentDetails.invoiceValue) {
                setError("Please enter an invoice value");
              } else if (!shipmentDetails.countryOfOrigin) {
                setError("Please select a country of origin");
              } else if (!shipmentDetails.destinationCountry) {
                setError("Please select a destination country");
              } else if (isWeightRequiredForCalculation() && !shipmentDetails.weight) {
                setError("Please enter weight - it's required for this HS code");
              } else {
                setError(null);
                setStep(3);
              }
            }}
          >
            Continue
          </CustomButton>
        </div>
      </div>
    </div>
  );

  // Render step 3: VAT and additional fees
  const renderVATStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">VAT & Additional Fees</h2>
        <p className="text-muted-foreground">
          Enter VAT rate and any additional fees for your destination country
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="vatRate" className="text-sm font-medium">
              VAT Rate (%) <span className="text-red-500">*</span>
            </label>
            <input
              id="vatRate"
              name="vatRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={shipmentDetails.vatRate}
              onChange={handleInputChange}
              placeholder="Enter VAT rate"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {shipmentDetails.destinationCountry && COUNTRY_VAT_RATES[shipmentDetails.destinationCountry as keyof typeof COUNTRY_VAT_RATES] && (
              <p className="text-xs text-green-600">
                ✓ Standard VAT rate for {COUNTRIES.find(c => c.code === shipmentDetails.destinationCountry)?.name}: {COUNTRY_VAT_RATES[shipmentDetails.destinationCountry as keyof typeof COUNTRY_VAT_RATES]}%
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="additionalFees" className="text-sm font-medium">
              Additional Fees (USD)
            </label>
            <input
              id="additionalFees"
              name="additionalFees"
              type="number"
              min="0"
              step="0.01"
              value={shipmentDetails.additionalFees}
              onChange={handleInputChange}
              placeholder="Enter additional fees"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Processing fees, handling charges, etc.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Enhanced Calculation Formula</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>1. CIF Value</strong> = Invoice Value + Freight Cost + Insurance Cost</p>
                <p><strong>2. Import Duty</strong> = Best applicable rate (considering all trade programs)</p>
                <p><strong>3. VAT Base</strong> = CIF Value + Import Duty + Additional Fees</p>
                <p><strong>4. VAT</strong> = VAT Base × VAT Rate</p>
                <p><strong>5. Total Payable</strong> = CIF Value + Import Duty + VAT + Additional Fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Show eligible programs preview */}
        {tariffData && shipmentDetails.countryOfOrigin && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Trade Programs Analysis</h4>
            <div className="text-sm text-green-700">
              {(() => {
                const eligibleSymbols = parseEligiblePrograms(tariffData.col1_special_text || '');
                const eligibleForCountry = eligibleSymbols.filter(symbol => 
                  isCountryEligibleForSymbol(shipmentDetails.countryOfOrigin, symbol, tariffData)
                );
                
                if (eligibleForCountry.length > 0) {
                  return (
                    <p>✓ Your origin country is eligible for: {eligibleForCountry.join(', ')}</p>
                  );
                } else if (isNonNTRCountry(shipmentDetails.countryOfOrigin)) {
                  return (
                    <p className="text-red-600">⚠️ Non-NTR country - Column 2 rates will apply</p>
                  );
                } else {
                  return (
                    <p>Standard MFN (Most Favored Nation) rates will apply</p>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <CustomButton variant="outline" onClick={() => setStep(2)}>
            Back
          </CustomButton>
          <CustomButton
            onClick={() => {
              if (!shipmentDetails.vatRate) {
                setError("Please enter a VAT rate");
              } else {
                setError(null);
                calculateTariff();
              }
            }}
          >
            Calculate Duties & Fees
          </CustomButton>
        </div>
      </div>
    </div>
  );

  // Enhanced results step
  const renderResultsStep = () => {
    if (!calculationResult) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Enhanced Calculation Results</h2>
          <p className="text-muted-foreground">
            Total amount payable at customs with detailed analysis
          </p>
        </div>

        {/* Main result */}
        <div className="bg-primary/10 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Total Amount Payable</h3>
          <p className="text-3xl font-bold">{formatCurrency(calculationResult.totalPayable)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Effective Rate: {formatPercentage(calculationResult.effectiveDutyRate)} of invoice value
          </p>
          {calculationResult.programApplied && (
            <p className="text-sm text-green-600 mt-1">
              ✓ {calculationResult.programApplied} benefits applied
            </p>
          )}
        </div>

        {/* Savings information */}
        {calculationResult.potentialSavings && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-2">💰 Duty Savings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-green-700">Standard MFN Duty:</p>
                <p className="font-bold">{formatCurrency(calculationResult.potentialSavings.standardDuty)}</p>
              </div>
              <div>
                <p className="text-green-700">Applied Duty:</p>
                <p className="font-bold">{formatCurrency(calculationResult.potentialSavings.appliedDuty)}</p>
              </div>
              <div>
                <p className="text-green-700">Total Savings:</p>
                <p className="font-bold text-green-600">{formatCurrency(calculationResult.potentialSavings.savings)}</p>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Savings achieved through {calculationResult.potentialSavings.programUsed}
            </p>
          </div>
        )}

        {/* Warnings */}
        {calculationResult.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Important Notices
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {calculationResult.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Detailed Breakdown</h3>
          <div className="space-y-3">
            {calculationResult.breakdown.map((item, index) => (
              <div 
                key={index} 
                className={cn(
                  "grid grid-cols-[1fr,auto] gap-2 pb-2 border-b border-border/40",
                  item.isHighlight && "bg-blue-50 px-3 py-2 rounded-md border-blue-200"
                )}
              >
                <div>
                  <p className={cn("font-medium", item.isHighlight && "text-blue-800")}>
                    {item.label}
                  </p>
                  <p className={cn("text-sm text-muted-foreground", item.isHighlight && "text-blue-600")}>
                    {item.description}
                  </p>
                </div>
                <p className={cn("font-medium text-right", item.isHighlight && "text-blue-800")}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Eligible programs */}
        {calculationResult.eligiblePrograms.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Eligible Trade Programs</h3>
            <div className="grid gap-3">
              {calculationResult.eligiblePrograms.map((program, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "border rounded-lg p-3",
                    program.name === calculationResult.programApplied 
                      ? "border-green-200 bg-green-50" 
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={cn(
                      "font-medium",
                      program.name === calculationResult.programApplied ? "text-green-800" : "text-foreground"
                    )}>
                      {program.name} ({program.symbol})
                      {program.name === calculationResult.programApplied && (
                        <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                          APPLIED
                        </span>
                      )}
                    </h4>
                    <span className={cn(
                      "text-sm font-medium",
                      program.name === calculationResult.programApplied ? "text-green-700" : "text-muted-foreground"
                    )}>
                      {program.rateType === 'Free' ? 'Free' : program.description}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{program.description}</p>
                  <div className="text-xs">
                    <p className="font-medium text-muted-foreground mb-1">Requirements:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {program.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="text-muted-foreground">{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced notes */}
        <div className="bg-secondary/50 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Important Notes
          </h3>
          <ul className="text-sm space-y-1 list-disc pl-5">
            <li>This calculation uses official tariff schedules and trade program rules</li>
            <li>Preferential rates are applied automatically when countries qualify</li>
            <li>Rate source: {calculationResult.rateSource}</li>
            <li>VAT is calculated on the combined value of CIF + Duty + Additional Fees</li>
            <li>Trade program benefits require proper documentation (certificates of origin, etc.)</li>
            <li>Actual fees may vary based on specific product requirements and port procedures</li>
            <li>Consult with a licensed customs broker for complex transactions</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <CustomButton variant="outline" onClick={() => setStep(3)}>
            Back
          </CustomButton>
          <CustomButton onClick={() => {
            // Reset the calculator
            setStep(1);
            setHsCode("");
            setHsCodeInput("");
            setTariffData(null);
            setCalculationResult(null);
            setShipmentDetails({
              hsCode: "",
              description: "",
              invoiceValue: "",
              freightCost: "",
              insuranceCost: "",
              quantity: "1",
              weight: "",
              countryOfOrigin: "",
              destinationCountry: "",
              vatRate: "",
              additionalFees: "",
              isFtaOriginCompliant: true,
            });
          }}>
            Start New Calculation
          </CustomButton>
        </div>
      </div>
    );
  };

  // Render progress steps
  const renderProgressSteps = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2">
        {[
          { step: 1, label: "HS Code" },
          { step: 2, label: "Shipment" },
          { step: 3, label: "VAT & Fees" },
          { step: 4, label: "Results" }
        ].map((stepInfo, index) => (
          <React.Fragment key={stepInfo.step}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  step >= stepInfo.step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {stepInfo.step}
              </div>
              <span className={cn(
                "text-xs mt-1 hidden sm:block",
                step >= stepInfo.step ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {stepInfo.label}
              </span>
            </div>
            {index < 3 && (
              <div
                className={cn(
                  "w-12 h-1 transition-colors",
                  step > stepInfo.step ? "bg-primary" : "bg-secondary"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Advanced Duty Calculator</h1>
          <p className="text-muted-foreground mt-2">
            Calculate accurate duties, taxes, and fees with comprehensive trade program analysis
          </p>
        </div>

        {renderProgressSteps()}

        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            {step === 1 && renderHSCodeStep()}
            {step === 2 && renderProductDetailsStep()}
            {step === 3 && renderVATStep()}
            {step === 4 && renderResultsStep()}
          </div>
        </div>

        {/* Additional Information Panel */}
        {tariffData && step > 1 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Tariff Information Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">HS Code</p>
                <p className="font-medium">{hsCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">MFN Rate</p>
                <p className="font-medium">{tariffData.mfn_text_rate || 'Free'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Special Programs</p>
                <p className="font-medium">
                  {parseEligiblePrograms(tariffData.col1_special_text || '').length > 0 
                    ? `${parseEligiblePrograms(tariffData.col1_special_text || '').length} available`
                    : 'None'
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity Unit</p>
                <p className="font-medium">{tariffData.quantity_1_code || 'Units'}</p>
              </div>
            </div>
            {tariffData.brief_description && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-muted-foreground text-xs">Product Description</p>
                <p className="text-sm">{tariffData.brief_description}</p>
              </div>
            )}
          </div>
        )}

        {/* Help and Documentation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">How This Calculator Works</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Enhanced Accuracy:</strong> This calculator uses official U.S. tariff schedules and automatically 
              applies the best available trade program rates based on your country of origin.
            </p>
            <p>
              <strong>Trade Programs Included:</strong> GSP, AGOA, CBI, USMCA, and all bilateral FTAs with 
              automatic eligibility checking and rate application.
            </p>
            <p>
              <strong>Rate Type Intelligence:</strong> Handles ad valorem, specific, and compound duty rates 
              with proper unit conversions (weight-based, quantity-based, etc.).
            </p>
            <p>
              <strong>Compliance Features:</strong> Includes FTA origin compliance checking, GSP country 
              exclusions, and non-NTR country identification.
            </p>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium mb-2">Trade Program Symbols</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>A*, A, A+</span>
                <span className="text-muted-foreground">GSP Programs</span>
              </div>
              <div className="flex justify-between">
                <span>D</span>
                <span className="text-muted-foreground">AGOA (Africa)</span>
              </div>
              <div className="flex justify-between">
                <span>E</span>
                <span className="text-muted-foreground">CBI (Caribbean)</span>
              </div>
              <div className="flex justify-between">
                <span>S</span>
                <span className="text-muted-foreground">USMCA (N. America)</span>
              </div>
              <div className="flex justify-between">
                <span>P</span>
                <span className="text-muted-foreground">CAFTA-DR (C. America)</span>
              </div>
              <div className="flex justify-between">
                <span>AU, CL, SG, etc.</span>
                <span className="text-muted-foreground">Bilateral FTAs</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium mb-2">Rate Types</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Free</span>
                <span className="text-muted-foreground">0% duty</span>
              </div>
              <div className="flex justify-between">
                <span>X%</span>
                <span className="text-muted-foreground">Ad valorem (% of value)</span>
              </div>
              <div className="flex justify-between">
                <span>$X/kg</span>
                <span className="text-muted-foreground">Specific (per unit)</span>
              </div>
              <div className="flex justify-between">
                <span>Column 2</span>
                <span className="text-muted-foreground">Non-NTR countries</span>
              </div>
              <div className="flex justify-between">
                <span>MFN/NTR</span>
                <span className="text-muted-foreground">Standard rates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Important Disclaimer
          </h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>
              This calculator provides estimates based on current tariff schedules and trade program rules. 
              Actual duties may vary based on:
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Product-specific requirements and classifications</li>
              <li>Documentation and certificate requirements</li>
              <li>Port-specific procedures and additional fees</li>
              <li>Changes in trade policy or tariff schedules</li>
              <li>Anti-dumping or countervailing duties</li>
              <li>Section 232, 301, or other additional tariffs</li>
            </ul>
            <p className="mt-2 font-medium">
              Always consult with a licensed customs broker or trade attorney for complex transactions 
              or when significant amounts are involved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TariffCalculator;