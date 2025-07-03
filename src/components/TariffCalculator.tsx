import React, { useState, useEffect } from "react";
import { getTariffInfo } from "@/lib/classifierService";
import { getUserClassifications, ClassificationRecord } from "@/lib/supabaseService";
import { useAuth } from "@clerk/clerk-react";
import { Loader2, AlertCircle, DollarSign, Package, Truck, FileText, Calculator, Info, ChevronDown, Search } from "lucide-react";
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
  }[];
  dutyRateUsed: string;
  ftaApplied?: string;
}

// Comprehensive country list with proper codes
const COUNTRIES = [
  { code: "AD", name: "Andorra" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "AF", name: "Afghanistan" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AI", name: "Anguilla" },
  { code: "AL", name: "Albania" },
  { code: "AM", name: "Armenia" },
  { code: "AO", name: "Angola" },
  { code: "AQ", name: "Antarctica" },
  { code: "AR", name: "Argentina" },
  { code: "AS", name: "American Samoa" },
  { code: "AT", name: "Austria" },
  { code: "AU", name: "Australia" },
  { code: "AW", name: "Aruba" },
  { code: "AX", name: "Åland Islands" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BB", name: "Barbados" },
  { code: "BD", name: "Bangladesh" },
  { code: "BE", name: "Belgium" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BG", name: "Bulgaria" },
  { code: "BH", name: "Bahrain" },
  { code: "BI", name: "Burundi" },
  { code: "BJ", name: "Benin" },
  { code: "BL", name: "Saint Barthélemy" },
  { code: "BM", name: "Bermuda" },
  { code: "BN", name: "Brunei" },
  { code: "BO", name: "Bolivia" },
  { code: "BQ", name: "Caribbean Netherlands" },
  { code: "BR", name: "Brazil" },
  { code: "BS", name: "Bahamas" },
  { code: "BT", name: "Bhutan" },
  { code: "BV", name: "Bouvet Island" },
  { code: "BW", name: "Botswana" },
  { code: "BY", name: "Belarus" },
  { code: "BZ", name: "Belize" },
  { code: "CA", name: "Canada" },
  { code: "CC", name: "Cocos Islands" },
  { code: "CD", name: "Democratic Republic of the Congo" },
  { code: "CF", name: "Central African Republic" },
  { code: "CG", name: "Republic of the Congo" },
  { code: "CH", name: "Switzerland" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CK", name: "Cook Islands" },
  { code: "CL", name: "Chile" },
  { code: "CM", name: "Cameroon" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "CU", name: "Cuba" },
  { code: "CV", name: "Cape Verde" },
  { code: "CW", name: "Curaçao" },
  { code: "CX", name: "Christmas Island" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DE", name: "Germany" },
  { code: "DJ", name: "Djibouti" },
  { code: "DK", name: "Denmark" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "DZ", name: "Algeria" },
  { code: "EC", name: "Ecuador" },
  { code: "EE", name: "Estonia" },
  { code: "EG", name: "Egypt" },
  { code: "EH", name: "Western Sahara" },
  { code: "ER", name: "Eritrea" },
  { code: "ES", name: "Spain" },
  { code: "ET", name: "Ethiopia" },
  { code: "FI", name: "Finland" },
  { code: "FJ", name: "Fiji" },
  { code: "FK", name: "Falkland Islands" },
  { code: "FM", name: "Micronesia" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GB", name: "United Kingdom" },
  { code: "GD", name: "Grenada" },
  { code: "GE", name: "Georgia" },
  { code: "GF", name: "French Guiana" },
  { code: "GG", name: "Guernsey" },
  { code: "GH", name: "Ghana" },
  { code: "GI", name: "Gibraltar" },
  { code: "GL", name: "Greenland" },
  { code: "GM", name: "Gambia" },
  { code: "GN", name: "Guinea" },
  { code: "GP", name: "Guadeloupe" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "GR", name: "Greece" },
  { code: "GS", name: "South Georgia" },
  { code: "GT", name: "Guatemala" },
  { code: "GU", name: "Guam" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HK", name: "Hong Kong" },
  { code: "HM", name: "Heard Island" },
  { code: "HN", name: "Honduras" },
  { code: "HR", name: "Croatia" },
  { code: "HT", name: "Haiti" },
  { code: "HU", name: "Hungary" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IM", name: "Isle of Man" },
  { code: "IN", name: "India" },
  { code: "IO", name: "British Indian Ocean Territory" },
  { code: "IQ", name: "Iraq" },
  { code: "IR", name: "Iran" },
  { code: "IS", name: "Iceland" },
  { code: "IT", name: "Italy" },
  { code: "JE", name: "Jersey" },
  { code: "JM", name: "Jamaica" },
  { code: "JO", name: "Jordan" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "KH", name: "Cambodia" },
  { code: "KI", name: "Kiribati" },
  { code: "KM", name: "Comoros" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "KY", name: "Cayman Islands" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "LA", name: "Laos" },
  { code: "LB", name: "Lebanon" },
  { code: "LC", name: "Saint Lucia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LK", name: "Sri Lanka" },
  { code: "LR", name: "Liberia" },
  { code: "LS", name: "Lesotho" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" },
  { code: "LY", name: "Libya" },
  { code: "MA", name: "Morocco" },
  { code: "MC", name: "Monaco" },
  { code: "MD", name: "Moldova" },
  { code: "ME", name: "Montenegro" },
  { code: "MF", name: "Saint Martin" },
  { code: "MG", name: "Madagascar" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MK", name: "North Macedonia" },
  { code: "ML", name: "Mali" },
  { code: "MM", name: "Myanmar" },
  { code: "MN", name: "Mongolia" },
  { code: "MO", name: "Macao" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "MQ", name: "Martinique" },
  { code: "MR", name: "Mauritania" },
  { code: "MS", name: "Montserrat" },
  { code: "MT", name: "Malta" },
  { code: "MU", name: "Mauritius" },
  { code: "MV", name: "Maldives" },
  { code: "MW", name: "Malawi" },
  { code: "MX", name: "Mexico" },
  { code: "MY", name: "Malaysia" },
  { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibia" },
  { code: "NC", name: "New Caledonia" },
  { code: "NE", name: "Niger" },
  { code: "NF", name: "Norfolk Island" },
  { code: "NG", name: "Nigeria" },
  { code: "NI", name: "Nicaragua" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "NP", name: "Nepal" },
  { code: "NR", name: "Nauru" },
  { code: "NU", name: "Niue" },
  { code: "NZ", name: "New Zealand" },
  { code: "OM", name: "Oman" },
  { code: "PA", name: "Panama" },
  { code: "PE", name: "Peru" },
  { code: "PF", name: "French Polynesia" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "PL", name: "Poland" },
  { code: "PM", name: "Saint Pierre and Miquelon" },
  { code: "PN", name: "Pitcairn Islands" },
  { code: "PR", name: "Puerto Rico" },
  { code: "PS", name: "Palestine" },
  { code: "PT", name: "Portugal" },
  { code: "PW", name: "Palau" },
  { code: "PY", name: "Paraguay" },
  { code: "QA", name: "Qatar" },
  { code: "RE", name: "Réunion" },
  { code: "RO", name: "Romania" },
  { code: "RS", name: "Serbia" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SC", name: "Seychelles" },
  { code: "SD", name: "Sudan" },
  { code: "SE", name: "Sweden" },
  { code: "SG", name: "Singapore" },
  { code: "SH", name: "Saint Helena" },
  { code: "SI", name: "Slovenia" },
  { code: "SJ", name: "Svalbard and Jan Mayen" },
  { code: "SK", name: "Slovakia" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SM", name: "San Marino" },
  { code: "SN", name: "Senegal" },
  { code: "SO", name: "Somalia" },
  { code: "SR", name: "Suriname" },
  { code: "SS", name: "South Sudan" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SV", name: "El Salvador" },
  { code: "SX", name: "Sint Maarten" },
  { code: "SY", name: "Syria" },
  { code: "SZ", name: "Eswatini" },
  { code: "TC", name: "Turks and Caicos Islands" },
  { code: "TD", name: "Chad" },
  { code: "TF", name: "French Southern Territories" },
  { code: "TG", name: "Togo" },
  { code: "TH", name: "Thailand" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TK", name: "Tokelau" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TN", name: "Tunisia" },
  { code: "TO", name: "Tonga" },
  { code: "TR", name: "Turkey" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TV", name: "Tuvalu" },
  { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" },
  { code: "UA", name: "Ukraine" },
  { code: "UG", name: "Uganda" },
  { code: "UM", name: "U.S. Minor Outlying Islands" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VA", name: "Vatican City" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "VE", name: "Venezuela" },
  { code: "VG", name: "British Virgin Islands" },
  { code: "VI", name: "U.S. Virgin Islands" },
  { code: "VN", name: "Vietnam" },
  { code: "VU", name: "Vanuatu" },
  { code: "WF", name: "Wallis and Futuna" },
  { code: "WS", name: "Samoa" },
  { code: "YE", name: "Yemen" },
  { code: "YT", name: "Mayotte" },
  { code: "ZA", name: "South Africa" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" }
];

// Free Trade Agreements mapping
const FTA_AGREEMENTS = {
  // US FTAs
  "US-AU": { name: "US-Australia FTA", indicator: "australia_indicator" },
  "US-BH": { name: "US-Bahrain FTA", indicator: "bahrain_indicator" },
  "US-CA": { name: "USMCA (US-Canada)", indicator: "usmca_indicator" },
  "US-CL": { name: "US-Chile FTA", indicator: "chile_indicator" },
  "US-CO": { name: "US-Colombia FTA", indicator: "columbia_indicator" },
  "US-CR": { name: "CAFTA-DR (US-Costa Rica)", indicator: "dr_cafta_indicator" },
  "US-DO": { name: "CAFTA-DR (US-Dominican Republic)", indicator: "dr_cafta_indicator" },
  "US-SV": { name: "CAFTA-DR (US-El Salvador)", indicator: "dr_cafta_indicator" },
  "US-GT": { name: "CAFTA-DR (US-Guatemala)", indicator: "dr_cafta_indicator" },
  "US-HN": { name: "CAFTA-DR (US-Honduras)", indicator: "dr_cafta_indicator" },
  "US-IL": { name: "US-Israel FTA", indicator: "israel_fta_indicator" },
  "US-JO": { name: "US-Jordan FTA", indicator: "jordan_indicator" },
  "US-KR": { name: "US-Korea FTA", indicator: "korea_indicator" },
  "US-MA": { name: "US-Morocco FTA", indicator: "morocco_indicator" },
  "US-MX": { name: "USMCA (US-Mexico)", indicator: "usmca_indicator" },
  "US-NI": { name: "CAFTA-DR (US-Nicaragua)", indicator: "dr_cafta_indicator" },
  "US-OM": { name: "US-Oman FTA", indicator: "oman_indicator" },
  "US-PA": { name: "US-Panama FTA", indicator: "panama_indicator" },
  "US-PE": { name: "US-Peru FTA", indicator: "peru_indicator" },
  "US-SG": { name: "US-Singapore FTA", indicator: "singapore_indicator" },
  
  // EU common VAT rates (for reference)
  "EU": { vatRate: 20 }, // Standard EU VAT rate
  
  // UK VAT
  "GB": { vatRate: 20 },
  
  // Common VAT rates by country
  "AT": { vatRate: 20 }, // Austria
  "BE": { vatRate: 21 }, // Belgium
  "BG": { vatRate: 20 }, // Bulgaria
  "HR": { vatRate: 25 }, // Croatia
  "CY": { vatRate: 19 }, // Cyprus
  "CZ": { vatRate: 21 }, // Czech Republic
  "DK": { vatRate: 25 }, // Denmark
  "EE": { vatRate: 20 }, // Estonia
  "FI": { vatRate: 24 }, // Finland
  "FR": { vatRate: 20 }, // France
  "DE": { vatRate: 19 }, // Germany
  "GR": { vatRate: 24 }, // Greece
  "HU": { vatRate: 27 }, // Hungary
  "IE": { vatRate: 23 }, // Ireland
  "IT": { vatRate: 22 }, // Italy
  "LV": { vatRate: 21 }, // Latvia
  "LT": { vatRate: 21 }, // Lithuania
  "LU": { vatRate: 17 }, // Luxembourg
  "MT": { vatRate: 18 }, // Malta
  "NL": { vatRate: 21 }, // Netherlands
  "PL": { vatRate: 23 }, // Poland
  "PT": { vatRate: 23 }, // Portugal
  "RO": { vatRate: 19 }, // Romania
  "SK": { vatRate: 20 }, // Slovakia
  "SI": { vatRate: 22 }, // Slovenia
  "ES": { vatRate: 21 }, // Spain
  "SE": { vatRate: 25 }, // Sweden
  "CA": { vatRate: 5 },  // Canada GST (varies by province)
  "AU": { vatRate: 10 }, // Australia GST
  "NZ": { vatRate: 15 }, // New Zealand GST
  "JP": { vatRate: 10 }, // Japan consumption tax
  "SG": { vatRate: 7 },  // Singapore GST
  "CH": { vatRate: 7.7 }, // Switzerland VAT
  "NO": { vatRate: 25 }, // Norway VAT
};

const TariffCalculator: React.FC<TariffCalculatorProps> = ({ initialHsCode = "" }) => {
  const { userId } = useAuth();
  const [hsCode, setHsCode] = useState(initialHsCode);
  const [tariffData, setTariffData] = useState<any | null>(null);
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
  });

  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  // Helper function to check if weight is required for calculation
  const isWeightRequiredForCalculation = (): boolean => {
    if (!tariffData) return false;
    
    // Check if the tariff has weight-based specific rates
    if (tariffData.mfn_text_rate) {
      const rateText = tariffData.mfn_text_rate.toString().toLowerCase();
      // Check for weight-based units (kg, kilogram, etc.)
      if (rateText.includes('kg') || rateText.includes('kilogram')) {
        return true;
      }
    }
    
    // Check if there's a specific rate that might be weight-based
    if (tariffData.mfn_specific_rate && tariffData.mfn_text_rate) {
      const rateText = tariffData.mfn_text_rate.toString().toLowerCase();
      if (rateText.includes('kg')) {
        return true;
      }
    }
    
    return false;
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
      const countryVat = FTA_AGREEMENTS[shipmentDetails.destinationCountry as keyof typeof FTA_AGREEMENTS];
      if (countryVat && 'vatRate' in countryVat) {
        setShipmentDetails(prev => ({
          ...prev,
          vatRate: countryVat.vatRate
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
    const { name, value } = e.target;

    if (["invoiceValue", "freightCost", "insuranceCost", "quantity", "weight", "vatRate", "additionalFees"].includes(name)) {
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

  // Helper function to check if a trade program indicator is eligible - EXACT copy from TariffInfo.tsx
  const isEligible = (indicator?: string): boolean => {
    if (!indicator || indicator.trim() === "" || indicator.toLowerCase() === "nan" || indicator.toLowerCase() === "null") {
      return false;
    }
    
    // Trade program indicators that mean "eligible" - EXACT from TariffInfo.tsx
    const eligibleIndicators = [
      // GSP indicators
      'A*', 'A', 'A+',
      // Country codes that indicate eligibility
      'AU', 'BH', 'CA', 'CL', 'CO', 'D', 'E', 'IL', 'JO', 'KR', 'MA', 'MX', 'OM', 'P', 'PA', 'PE', 'S', 'SG',
      // Other common eligibility indicators
      'Free', 'FREE', 'Duty-free', 'DUTY-FREE'
    ];
    
    const cleanIndicator = indicator.trim().toUpperCase();
    
    // Check if the indicator matches any known eligible codes
    return eligibleIndicators.some(code => cleanIndicator === code.toUpperCase()) || 
           // Also check if it's a valid country/program code (2-3 letter codes)
           /^[A-Z*+]{1,3}$/.test(cleanIndicator);
  };

  // Trade programs configuration matching TariffInfo.tsx EXACTLY
  const TRADE_PROGRAMS = [
    { 
      key: 'gsp_indicator', 
      label: 'GSP (Generalized System of Preferences)', 
      rateField: null,
      countries: 'Developing countries including India, Brazil, Thailand, Turkey, and others'
    },
    { 
      key: 'cbi_indicator', 
      label: 'CBI or CBERA (Caribbean Basin Initiative) Preference', 
      rateField: 'cbi_ad_val_rate',
      countries: 'Antigua, Barbados, Belize, Costa Rica, Dominica, Dominican Republic, El Salvador, Grenada, Guatemala, Guyana, Haiti, Honduras, Jamaica, Montserrat, Nicaragua, Panama, St. Kitts & Nevis, St. Lucia, St. Vincent & Grenadines, Trinidad & Tobago'
    },
    { 
      key: 'agoa_indicator', 
      label: 'AGOA (African Growth and Opportunity Act)', 
      rateField: null,
      countries: 'Sub-Saharan African countries including South Africa, Kenya, Ghana, Nigeria, Ethiopia, and others'
    },
    { 
      key: 'morocco_indicator', 
      label: 'Morocco FTA Preference', 
      rateField: 'morocco_ad_val_rate',
      countries: 'Morocco'
    },
    { 
      key: 'jordan_indicator', 
      label: 'Jordan FTA Preference', 
      rateField: 'jordan_ad_val_rate',
      countries: 'Jordan'
    },
    { 
      key: 'singapore_indicator', 
      label: 'Singapore FTA Preference', 
      rateField: 'singapore_ad_val_rate',
      countries: 'Singapore'
    },
    { 
      key: 'chile_indicator', 
      label: 'Chile FTA Preference', 
      rateField: 'chile_ad_val_rate',
      countries: 'Chile'
    },
    { 
      key: 'australia_indicator', 
      label: 'Australia FTA Preference', 
      rateField: 'australia_ad_val_rate',
      countries: 'Australia'
    },
    { 
      key: 'bahrain_indicator', 
      label: 'Bahrain FTA Preference', 
      rateField: 'bahrain_ad_val_rate',
      countries: 'Bahrain'
    },
    { 
      key: 'dr_cafta_indicator', 
      label: 'CAFTA FTA Preference', 
      rateField: 'dr_cafta_ad_val_rate',
      countries: 'Costa Rica, Dominican Republic, El Salvador, Guatemala, Honduras, Nicaragua'
    },
    { 
      key: 'oman_indicator', 
      label: 'Oman FTA Preference', 
      rateField: 'oman_ad_val_rate',
      countries: 'Oman'
    },
    { 
      key: 'peru_indicator', 
      label: 'Peru FTA Preference', 
      rateField: 'peru_ad_val_rate',
      countries: 'Peru'
    },
    { 
      key: 'korea_indicator', 
      label: 'Korea FTA Preference', 
      rateField: 'korea_ad_val_rate',
      countries: 'South Korea'
    },
    { 
      key: 'columbia_indicator', 
      label: 'Colombia FTA', 
      rateField: 'columbia_ad_val_rate',
      countries: 'Colombia'
    },
    { 
      key: 'panama_indicator', 
      label: 'Panama FTA Preference', 
      rateField: 'panama_ad_val_rate',
      countries: 'Panama'
    },
    { 
      key: 'usmca_indicator', 
      label: 'USMCA FTA Preference', 
      rateField: 'usmca_ad_val_rate',
      countries: 'Canada, Mexico'
    },
    { 
      key: 'israel_fta_indicator', 
      label: 'Israel FTA Preference', 
      rateField: null,
      countries: 'Israel'
    },
    { 
      key: 'nafta_canada_ind', 
      label: 'NAFTA Canada Preference', 
      rateField: null,
      countries: 'Canada'
    },
    { 
      key: 'nafta_mexico_ind', 
      label: 'NAFTA Mexico Preference', 
      rateField: 'nafta_mexico_ad_val_rate',
      countries: 'Mexico'
    },
  ] as const;

  // Country mapping for trade programs - more comprehensive
  const getCountryEligibilityForProgram = (programKey: string, originCountry: string): boolean => {
    const country = originCountry.toUpperCase();
    
    switch (programKey) {
      case 'gsp_indicator':
        // GSP eligible countries (major ones) - Afghanistan is NOT eligible
        return ['IN', 'BR', 'TH', 'TR', 'ID', 'PH', 'MY', 'VN', 'BD', 'PK', 'LK', 'EG', 'MA', 'TN', 'DZ', 'NG', 'GH', 'KE', 'TZ', 'UG', 'ZM', 'ZW', 'BW', 'MU', 'MG', 'SN', 'CI', 'CM', 'BF', 'ML', 'NE', 'TD', 'CF', 'CG', 'GA', 'GQ', 'ST', 'CV', 'GM', 'GN', 'GW', 'LR', 'SL', 'TG', 'BJ', 'BI', 'RW', 'DJ', 'ER', 'ET', 'SO', 'SD', 'SS', 'KM', 'MV', 'FJ', 'PG', 'SB', 'VU', 'WS', 'TO', 'TV', 'KI', 'NR', 'PW', 'FM', 'MH', 'AR', 'BO', 'PY', 'UY', 'EC', 'VE', 'GY', 'SR', 'JM', 'TT', 'BB', 'GD', 'LC', 'VC', 'KN', 'AG', 'DM', 'BS', 'BZ', 'HT'].includes(country);
      
      case 'agoa_indicator':
        // AGOA eligible countries (Sub-Saharan Africa)
        return ['ZA', 'KE', 'GH', 'NG', 'ET', 'TZ', 'UG', 'RW', 'BW', 'MU', 'MG', 'SN', 'CI', 'CM', 'BF', 'ML', 'NE', 'TD', 'CF', 'CG', 'GA', 'GQ', 'ST', 'CV', 'GM', 'GN', 'GW', 'LR', 'SL', 'TG', 'BJ', 'BI', 'DJ', 'ER', 'SO', 'SS', 'KM', 'MZ', 'ZM', 'ZW', 'MW', 'LS', 'SZ', 'NA', 'AO'].includes(country);
      
      case 'cbi_indicator':
        // CBI eligible countries
        return ['BB', 'BZ', 'CR', 'DM', 'DO', 'SV', 'GD', 'GT', 'GY', 'HT', 'HN', 'JM', 'MS', 'NI', 'PA', 'KN', 'LC', 'VC', 'TT', 'AG'].includes(country);
      
      case 'australia_indicator':
        return country === 'AU';
      case 'bahrain_indicator':
        return country === 'BH';
      case 'chile_indicator':
        return country === 'CL';
      case 'columbia_indicator':
        return country === 'CO';
      case 'israel_fta_indicator':
        return country === 'IL';
      case 'jordan_indicator':
        return country === 'JO';
      case 'korea_indicator':
        return country === 'KR';
      case 'morocco_indicator':
        return country === 'MA';
      case 'oman_indicator':
        return country === 'OM';
      case 'panama_indicator':
        return country === 'PA';
      case 'peru_indicator':
        return country === 'PE';
      case 'singapore_indicator':
        return country === 'SG';
      case 'nafta_canada_ind':
      case 'usmca_indicator':
        return ['CA', 'MX'].includes(country);
      case 'nafta_mexico_ind':
        return country === 'MX';
      case 'dr_cafta_indicator':
        return ['CR', 'DO', 'SV', 'GT', 'HN', 'NI'].includes(country);
      
      default:
        return false;
    }
  };

  // Calculate duty and fees using the exact formula provided with enhanced tariff logic
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

    console.log("Starting calculation with:", {
      invoiceValue,
      freightCost,
      insuranceCost,
      vatRate,
      additionalFees,
      quantity,
      weight,
      tariffData
    });

    // Step 1: Calculate CIF Value (Customs Value)
    const cifValue = invoiceValue + freightCost + insuranceCost;
    console.log("CIF Value:", cifValue);

    // Step 2: Determine the best applicable duty rate
    let dutyAmount = 0;
    let dutyRateDescription = "0%";
    let dutyRate = 0;
    let ftaApplied = "";
    let rateSource = "MFN/NTR";
    
    const origin = shipmentDetails.countryOfOrigin.toUpperCase();
    const destination = shipmentDetails.destinationCountry.toUpperCase();
    
    console.log("Origin:", origin, "Destination:", destination);

    // Check for special preferential programs first (most favorable rates)
    let bestRate = null;
    let bestRateSource = "";
    
    // 1. Check all trade programs for eligibility - FIXED LOGIC
    for (const program of TRADE_PROGRAMS) {
      const indicator = tariffData[program.key as keyof typeof tariffData] as string;
      
      // First check if the indicator shows eligibility
      if (isEligible(indicator)) {
        // Then check if the origin country is actually eligible for this program
        const isCountryEligible = getCountryEligibilityForProgram(program.key, origin);
        
        console.log(`Checking ${program.label} for ${origin}:`, {
          indicator,
          isIndicatorEligible: isEligible(indicator),
          isCountryEligible,
          programKey: program.key
        });
        
        if (isCountryEligible) {
          const programRate = program.rateField ? (tariffData[program.rateField as keyof typeof tariffData] as number) || 0 : 0;
          
          console.log(`${program.label} is applicable for ${origin} with rate:`, programRate);
          
          if (bestRate === null || programRate < bestRate) {
            bestRate = programRate;
            bestRateSource = program.label;
            ftaApplied = program.label;
            console.log(`New best rate: ${bestRate} from ${bestRateSource}`);
          }
        } else {
          console.log(`${program.label} indicator shows eligible but ${origin} is not an eligible country`);
        }
      } else {
        console.log(`${program.label} indicator not eligible:`, indicator);
      }
    }

    // 2. If no preferential rate found, use MFN/NTR rate
    if (bestRate === null) {
      // Check if origin country has Column 2 status (non-NTR countries like North Korea, Cuba, etc.)
      const isColumn2Country = ['KP', 'CU'].includes(origin); // Add more as needed
      
      if (isColumn2Country && tariffData.col2_ad_val_rate) {
        bestRate = tariffData.col2_ad_val_rate;
        bestRateSource = "Column 2 (Non-NTR)";
        rateSource = "Column 2";
      } else {
        // Use MFN/NTR rate
        bestRate = tariffData.mfn_ad_val_rate || 0;
        bestRateSource = "MFN/NTR (Normal Trade Relations)";
        rateSource = "MFN/NTR";
      }
    }

    console.log("Best applicable rate:", bestRate, "from", bestRateSource);

    // 3. Calculate duty based on the best rate found
    if (bestRate === 0 && ftaApplied) {
      dutyAmount = 0;
      dutyRateDescription = `Free (${ftaApplied})`;
    } else if (tariffData.mfn_specific_rate || (tariffData.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('cents'))) {
      // Handle specific rates (per unit/kg/etc.)
      const specificRate = tariffData.mfn_specific_rate || 0;
      let rateFromText = 0;
      let unit = "unit";
      
      if (tariffData.mfn_text_rate) {
        const rateText = tariffData.mfn_text_rate.toString();
        const centsPerUnitMatch = rateText.match(/(\d+\.?\d*)\s*cents?\s*per\s*(kg|liter|piece|dozen|m2|m3|pair|unit)/i) ||
                                  rateText.match(/(\d+\.?\d*)\s*¢\s*\/(kg|liter|piece|dozen|m2|m3|pair|unit)/i) ||
                                  rateText.match(/(\d+\.?\d*)\s*cents?\/(kg|liter|piece|dozen|m2|m3|pair|unit)/i);
        const dollarsPerUnitMatch = rateText.match(/\$(\d+\.?\d*)\s*per\s*(kg|liter|piece|dozen|m2|m3|pair|unit)/i) ||
                                    rateText.match(/\$(\d+\.?\d*)\/(kg|liter|piece|dozen|m2|m3|pair|unit)/i);
        
        if (centsPerUnitMatch) {
          rateFromText = parseFloat(centsPerUnitMatch[1]) / 100;
          unit = centsPerUnitMatch[2].toLowerCase();
        } else if (dollarsPerUnitMatch) {
          rateFromText = parseFloat(dollarsPerUnitMatch[1]);
          unit = dollarsPerUnitMatch[2].toLowerCase();
        }
      }
      
      const effectiveSpecificRate = rateFromText > 0 ? rateFromText : specificRate;
      
      if (unit.includes("kg")) {
        dutyAmount = effectiveSpecificRate * (weight || quantity);
        dutyRateDescription = `$${effectiveSpecificRate.toFixed(3)} per kg (${rateSource})`;
      } else if (unit.includes("liter")) {
        dutyAmount = effectiveSpecificRate * quantity;
        dutyRateDescription = `$${effectiveSpecificRate.toFixed(3)} per liter (${rateSource})`;
      } else {
        dutyAmount = effectiveSpecificRate * quantity;
        dutyRateDescription = `$${effectiveSpecificRate.toFixed(3)} per unit (${rateSource})`;
      }
    } else {
      // Handle ad valorem rates (percentage of value)
      dutyRate = bestRate || 0;
      
      // Ensure rate is in decimal form
      if (dutyRate > 1) {
        dutyRate = dutyRate / 100;
      }
      
      dutyAmount = cifValue * dutyRate;
      dutyRateDescription = `${(dutyRate * 100).toFixed(2)}% of CIF value (${rateSource})`;
    }

    console.log("Import Duty:", dutyAmount, "Description:", dutyRateDescription);

    // Step 3: Calculate VAT Base
    const vatBase = cifValue + dutyAmount + additionalFees;
    console.log("VAT Base:", vatBase);

    // Step 4: Calculate VAT
    const vatAmount = vatBase * (vatRate / 100);
    console.log("VAT Amount:", vatAmount);

    // Step 5: Calculate Total Payable
    const totalPayable = cifValue + dutyAmount + vatAmount + additionalFees;
    console.log("Total Payable:", totalPayable);

    // Calculate effective duty rate
    const effectiveDutyRate = cifValue > 0 ? (totalPayable / cifValue) : 0;

    // Create breakdown for detailed view
    const breakdown = [
      {
        label: "CIF Value (Invoice + Freight + Insurance)",
        value: cifValue,
        description: `Invoice: ${formatCurrency(invoiceValue)}, Freight: ${formatCurrency(freightCost)}, Insurance: ${formatCurrency(insuranceCost)}`
      },
      {
        label: "Import Duty",
        value: dutyAmount,
        description: dutyRateDescription + (ftaApplied ? ` - ${ftaApplied} applied` : '')
      },
      {
        label: "VAT Base (CIF + Duty + Additional Fees)",
        value: vatBase,
        description: `VAT calculated on: ${formatCurrency(vatBase)}`
      },
      {
        label: "VAT",
        value: vatAmount,
        description: `${vatRate}% of VAT base`
      },
      {
        label: "Additional Fees",
        value: additionalFees,
        description: "Processing fees, handling charges, etc."
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
      ftaApplied
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

        {/* Tariff Rate Display */}
        {tariffData && hsCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <Calculator className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-800 mb-2">Tariff Information Found</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-green-700">
                        <strong>HS Code:</strong> {hsCode}
                      </p>
                      {tariffData.brief_description && (
                        <p className="text-green-700">
                          <strong>Description:</strong> {tariffData.brief_description}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-green-700">
                        <strong>MFN Duty Rate:</strong> {
                          tariffData.mfn_ad_val_rate 
                            ? `${tariffData.mfn_ad_val_rate}%` 
                            : tariffData.mfn_text_rate || 'Free'
                        }
                      </p>
                      {tariffData.mfn_specific_rate && (
                        <p className="text-green-700">
                          <strong>Specific Rate:</strong> ${tariffData.mfn_specific_rate}
                        </p>
                      )}
                    </div>
                  </div>
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

  // Render step 2: Product and shipment details
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
                </option>
              ))}
            </select>
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
              {tariffData?.mfn_specific_rate || (tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('cents')) ? (
                <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                  Required for this HS code
                </span>
              ) : null}
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={shipmentDetails.quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              className={cn(
                "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                tariffData?.mfn_specific_rate || (tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('cents')) 
                  ? "border-yellow-300 bg-yellow-50" 
                  : "border-input"
              )}
            />
          </div>
        </div>

        {/* Conditionally render weight field only when required */}
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
                Weight is required for calculating duties on this HS code
              </p>
            </div>

            <div></div>
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
            {shipmentDetails.destinationCountry && FTA_AGREEMENTS[shipmentDetails.destinationCountry as keyof typeof FTA_AGREEMENTS] && 'vatRate' in FTA_AGREEMENTS[shipmentDetails.destinationCountry as keyof typeof FTA_AGREEMENTS] && (
              <p className="text-xs text-muted-foreground">
                Standard VAT rate for {COUNTRIES.find(c => c.code === shipmentDetails.destinationCountry)?.name}: {(FTA_AGREEMENTS[shipmentDetails.destinationCountry as keyof typeof FTA_AGREEMENTS] as any).vatRate}%
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
              <h4 className="font-medium text-blue-700 mb-2">Calculation Formula</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>1. CIF Value</strong> = Invoice Value + Freight Cost + Insurance Cost</p>
                <p><strong>2. Import Duty</strong> = CIF Value × Duty Rate</p>
                <p><strong>3. VAT Base</strong> = CIF Value + Import Duty + Additional Fees</p>
                <p><strong>4. VAT</strong> = VAT Base × VAT Rate</p>
                <p><strong>5. Total Payable</strong> = CIF Value + Import Duty + VAT + Additional Fees</p>
              </div>
            </div>
          </div>
        </div>

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

  // Render step 4: Results
  const renderResultsStep = () => {
    if (!calculationResult) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Calculation Results</h2>
          <p className="text-muted-foreground">
            Total amount payable at customs
          </p>
        </div>

        <div className="bg-primary/10 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Total Amount Payable</h3>
          <p className="text-3xl font-bold">{formatCurrency(calculationResult.totalPayable)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Effective Rate: {formatPercentage(calculationResult.effectiveDutyRate)} of invoice value
          </p>
          {calculationResult.ftaApplied && (
            <p className="text-sm text-green-600 mt-1">
              ✓ {calculationResult.ftaApplied} benefits applied
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Detailed Breakdown</h3>
          <div className="space-y-3">
            {calculationResult.breakdown.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr,auto] gap-2 pb-2 border-b border-border/40">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <p className="font-medium text-right">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary/50 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Important Notes
          </h3>
          <ul className="text-sm space-y-1 list-disc pl-5">
            <li>This calculation follows the exact customs formula: CIF + Duty + VAT + Additional Fees</li>
            <li>Duty rates are based on current tariff schedules and FTA eligibility</li>
            <li>VAT is calculated on the combined value of CIF + Duty + Additional Fees</li>
            <li>Actual fees may vary based on specific product requirements and documentation</li>
            <li>Consult with a customs broker for professional advice</li>
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
        {[1, 2, 3, 4].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                step >= stepNumber
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {stepNumber}
            </div>
            {stepNumber < 4 && (
              <div
                className={cn(
                  "w-12 h-1 transition-colors",
                  step > stepNumber ? "bg-primary" : "bg-secondary"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Duty Calculator</h1>
          <p className="text-muted-foreground mt-2">
            Calculate accurate duties, taxes, and fees using the official customs formula
          </p>
        </div>

        {renderProgressSteps()}

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          {step === 1 && renderHSCodeStep()}
          {step === 2 && renderProductDetailsStep()}
          {step === 3 && renderVATStep()}
          {step === 4 && renderResultsStep()}
        </div>
      </div>
    </div>
  );
};

export default TariffCalculator;
