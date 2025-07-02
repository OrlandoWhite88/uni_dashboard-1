import React, { useState, useEffect, useMemo } from "react";
import { getTariffInfo, explainTariff } from "@/lib/classifierService";
import { Loader2, AlertCircle, ExternalLink, BookOpen, LightbulbIcon, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";

interface TariffInfoProps {
  hsCode: string;
  className?: string;
  preloadedData?: TariffData | null;
  isLoading?: boolean;
  preloadError?: string | null;
}

// Updated interface based on actual API response
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
  footnote_comment?: string;
  
  // Trade program indicators - using actual API field names
  gsp_indicator?: string;
  gsp_ctry_excluded?: string;
  nafta_canada_ind?: string;
  nafta_mexico_ind?: string;
  cbi_indicator?: string;
  cbi_ad_val_rate?: number;
  agoa_indicator?: string;
  israel_fta_indicator?: string;
  jordan_indicator?: string;
  jordan_ad_val_rate?: number;
  singapore_indicator?: string;
  singapore_ad_val_rate?: number;
  chile_indicator?: string;
  chile_ad_val_rate?: number;
  morocco_indicator?: string;
  morocco_ad_val_rate?: number;
  australia_indicator?: string;
  australia_ad_val_rate?: number;
  bahrain_indicator?: string;
  bahrain_ad_val_rate?: number;
  dr_cafta_indicator?: string;
  dr_cafta_ad_val_rate?: number;
  oman_indicator?: string;
  oman_ad_val_rate?: number;
  peru_indicator?: string;
  peru_ad_val_rate?: number;
  korea_indicator?: string;
  korea_ad_val_rate?: number;
  columbia_indicator?: string;
  columbia_ad_val_rate?: number;
  panama_indicator?: string;
  panama_ad_val_rate?: number;
  usmca_indicator?: string;
  usmca_ad_val_rate?: number;
  
  // Additional fields from API
  requested_hts_code?: string;
  matched_hts_code?: string;
}

// Optimized helper functions
const formatRateValue = (value: number | string | undefined): string => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
    return "None";
  }
  
  if (typeof value === "number") {
    if (value === 0) return "Free";
    if (value < 1 && value > 0) return `${(value * 100).toFixed(1)}%`;
    return `$${value.toFixed(3)}`;
  }
  
  if (typeof value === "string" && (value.toLowerCase() === "nan" || value.toLowerCase() === "null")) {
    return "None";
  }
  
  return value.toString();
};

// Format specific rates (like $0.022 for cents/kg)
const formatSpecificRate = (value: number | string | undefined): string => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
    return "$0.0";
  }
  
  if (typeof value === "number") {
    if (value === 0) return "$0.0";
    return `$${value.toFixed(3)}`;
  }
  
  if (typeof value === "string" && (value.toLowerCase() === "nan" || value.toLowerCase() === "null")) {
    return "$0.0";
  }
  
  return value.toString();
};

// Format percentage rates
const formatPercentageRate = (value: number | string | undefined): string => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
    return "0%";
  }
  
  if (typeof value === "number") {
    if (value === 0) return "0%";
    if (value < 1) return `${(value * 100).toFixed(1)}%`;
    return `${value.toFixed(1)}%`;
  }
  
  if (typeof value === "string" && (value.toLowerCase() === "nan" || value.toLowerCase() === "null")) {
    return "0%";
  }
  
  return value.toString();
};

// Get duty calculation description based on rate type
const getDutyCalculation = (textRate: string | undefined, isCol2: boolean = false): string => {
  if (!textRate || textRate.toLowerCase() === "free") {
    return "Duty rate is free. No computation necessary";
  }
  
  if (textRate.includes("cents") || textRate.includes("/kg") || textRate.includes("/lb")) {
    return isCol2 ? "Specific rate*Q1" : "Specific rate*Q1";
  }
  
  if (textRate.includes("%")) {
    return "Ad Valorem rate*Value";
  }
  
  return "Ad Valorem rate*Value";
};

const isEligible = (indicator?: string): boolean => {
  if (!indicator || indicator.trim() === "" || indicator.toLowerCase() === "nan" || indicator.toLowerCase() === "null") {
    return false;
  }
  
  // Trade program indicators that mean "eligible"
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

const formatDate = (dateStr?: string): string => {
  if (!dateStr || dateStr.toLowerCase() === "nan" || dateStr.toLowerCase() === "null") return "";
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }
  
  return dateStr;
};

// Trade program configuration with country information - matching US Gov website order
const TRADE_PROGRAMS = [
  { 
    key: 'gsp_indicator', 
    label: 'GSP (Generalized System of Preferences)', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Developing countries including India, Brazil, Thailand, Turkey, and others'
  },
  { 
    key: 'civil_aircraft_indicator', 
    label: 'Civil Aircraft Agreement Preference', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'WTO member countries for civil aircraft'
  },
  { 
    key: 'dyes_indicator', 
    label: 'Tariff concession on Dyes', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Various countries for specific dye products'
  },
  { 
    key: 'cbi_indicator', 
    label: 'CBI or CBERA (Caribbean Basin Initiative) Preference', 
    rateField: 'cbi_ad_val_rate',
    specificRateField: 'cbi_specific_rate',
    otherRateField: 'cbi_other_rate',
    countries: 'Antigua, Barbados, Belize, Costa Rica, Dominica, Dominican Republic, El Salvador, Grenada, Guatemala, Guyana, Haiti, Honduras, Jamaica, Montserrat, Nicaragua, Panama, St. Kitts & Nevis, St. Lucia, St. Vincent & Grenadines, Trinidad & Tobago'
  },
  { 
    key: 'agoa_indicator', 
    label: 'AGOA (African Growth and Opportunity Act)', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Sub-Saharan African countries including South Africa, Kenya, Ghana, Nigeria, Ethiopia, and others'
  },
  { 
    key: 'cbtpa_indicator', 
    label: 'CBTPA (Caribbean Basin Trade Partnership Act)', 
    rateField: 'cbtpa_ad_val_rate',
    specificRateField: 'cbtpa_specific_rate',
    otherRateField: 'cbtpa_other_rate',
    countries: 'Caribbean Basin countries under CBTPA'
  },
  { 
    key: 'morocco_indicator', 
    label: 'Morocco FTA Preference', 
    rateField: 'morocco_ad_val_rate',
    specificRateField: 'morocco_specific_rate',
    otherRateField: 'morocco_other_rate',
    countries: 'Morocco'
  },
  { 
    key: 'jordan_indicator', 
    label: 'Jordan FTA Preference', 
    rateField: 'jordan_ad_val_rate',
    specificRateField: 'jordan_specific_rate',
    otherRateField: 'jordan_other_rate',
    countries: 'Jordan'
  },
  { 
    key: 'singapore_indicator', 
    label: 'Singapore FTA Preference', 
    rateField: 'singapore_ad_val_rate',
    specificRateField: 'singapore_specific_rate',
    otherRateField: 'singapore_other_rate',
    countries: 'Singapore'
  },
  { 
    key: 'chile_indicator', 
    label: 'Chile FTA Preference', 
    rateField: 'chile_ad_val_rate',
    specificRateField: 'chile_specific_rate',
    otherRateField: 'chile_other_rate',
    countries: 'Chile'
  },
  { 
    key: 'australia_indicator', 
    label: 'Australia FTA Preference', 
    rateField: 'australia_ad_val_rate',
    specificRateField: 'australia_specific_rate',
    otherRateField: 'australia_other_rate',
    countries: 'Australia'
  },
  { 
    key: 'bahrain_indicator', 
    label: 'Bahrain FTA Preference', 
    rateField: 'bahrain_ad_val_rate',
    specificRateField: 'bahrain_specific_rate',
    otherRateField: 'bahrain_other_rate',
    countries: 'Bahrain'
  },
  { 
    key: 'dr_cafta_indicator', 
    label: 'CAFTA FTA Preference', 
    rateField: 'dr_cafta_ad_val_rate',
    specificRateField: 'dr_cafta_specific_rate',
    otherRateField: 'dr_cafta_other_rate',
    countries: 'Costa Rica, Dominican Republic, El Salvador, Guatemala, Honduras, Nicaragua'
  },
  { 
    key: 'cafta_plus_indicator', 
    label: 'CAFTA PLUS FTA Preference', 
    rateField: 'cafta_plus_ad_val_rate',
    specificRateField: 'cafta_plus_specific_rate',
    otherRateField: 'cafta_plus_other_rate',
    countries: 'Enhanced CAFTA countries'
  },
  { 
    key: 'oman_indicator', 
    label: 'Oman FTA Preference', 
    rateField: 'oman_ad_val_rate',
    specificRateField: 'oman_specific_rate',
    otherRateField: 'oman_other_rate',
    countries: 'Oman'
  },
  { 
    key: 'peru_indicator', 
    label: 'Peru FTA Preference', 
    rateField: 'peru_ad_val_rate',
    specificRateField: 'peru_specific_rate',
    otherRateField: 'peru_other_rate',
    countries: 'Peru'
  },
  { 
    key: 'korea_indicator', 
    label: 'Korea FTA Preference', 
    rateField: 'korea_ad_val_rate',
    specificRateField: 'korea_specific_rate',
    otherRateField: 'korea_other_rate',
    countries: 'South Korea'
  },
  { 
    key: 'japan_indicator', 
    label: 'Japan FTA Preference', 
    rateField: 'japan_ad_val_rate',
    specificRateField: 'japan_specific_rate',
    otherRateField: 'japan_other_rate',
    countries: 'Japan'
  },
  { 
    key: 'usmca_indicator', 
    label: 'USMCA FTA Preference', 
    rateField: 'usmca_ad_val_rate',
    specificRateField: 'usmca_specific_rate',
    otherRateField: 'usmca_other_rate',
    countries: 'Canada, Mexico'
  },
  { 
    key: 'israel_fta_indicator', 
    label: 'Israel FTA Preference', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Israel'
  },
  { 
    key: 'apta_indicator', 
    label: 'APTA (Auto Product Agreement) Preference', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Canada (automotive products)'
  },
  { 
    key: 'atpa_indicator', 
    label: 'ATPA (Andean Agreement) Preference', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Bolivia, Colombia, Ecuador, Peru'
  },
  { 
    key: 'pharma_indicator', 
    label: 'Pharmaceutical Agreement Preference', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'WTO member countries for pharmaceutical products'
  },
  { 
    key: 'nafta_canada_ind', 
    label: 'NAFTA Canada Preference', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Canada'
  },
  { 
    key: 'nafta_mexico_ind', 
    label: 'NAFTA Mexico Preference', 
    rateField: 'nafta_mexico_ad_val_rate',
    specificRateField: 'nafta_mexico_specific_rate',
    otherRateField: null,
    countries: 'Mexico'
  },
  { 
    key: 'atpdea_indicator', 
    label: 'ATPDEA Indicator', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Bolivia, Colombia, Ecuador, Peru (enhanced preferences)'
  },
  { 
    key: 'nepal_indicator', 
    label: 'Nepal Preference Program', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Nepal'
  },
  { 
    key: 'columbia_indicator', 
    label: 'Colombia FTA', 
    rateField: 'columbia_ad_val_rate',
    specificRateField: 'columbia_specific_rate',
    otherRateField: 'columbia_other_rate',
    countries: 'Colombia'
  },
  { 
    key: 'panama_indicator', 
    label: 'Panama FTA Preference', 
    rateField: 'panama_ad_val_rate',
    specificRateField: 'panama_specific_rate',
    otherRateField: 'panama_other_rate',
    countries: 'Panama'
  },
] as const;

interface FootnoteReference {
  code: string;
  data: any;
  loading: boolean;
  error: string | null;
}

const TariffInfo: React.FC<TariffInfoProps> = ({ 
  hsCode, 
  className, 
  preloadedData, 
  isLoading: preloadIsLoading = false, 
  preloadError 
}) => {
  const [tariffData, setTariffData] = useState<TariffData | null>(preloadedData || null);
  const [loading, setLoading] = useState(!preloadedData && !preloadIsLoading);
  const [error, setError] = useState<string | null>(preloadError || null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [footnoteReferences, setFootnoteReferences] = useState<Record<string, FootnoteReference>>({});
  const navigate = useNavigate();

  // Memoized function to organize tariff data into logical sections for display
  const getTariffSections = useMemo(() => {
    if (!tariffData) return [];
    
    console.log(`🧮 Computing tariff sections...`);
    const startTime = performance.now();

    // Build trade programs dynamically from API data - process all programs
    const allPrograms = TRADE_PROGRAMS.map(program => {
      const indicator = tariffData[program.key as keyof TariffData] as string;
      const rateValue = program.rateField ? tariffData[program.rateField as keyof TariffData] as number : 0;
      
      return {
        label: program.label,
        status: isEligible(indicator) ? `Eligible: code "${indicator}"` : "Not Eligible",
        adValRate: rateValue || 0,
        eligible: isEligible(indicator),
        indicator: indicator,
        countries: program.countries
      };
    });

    // Separate eligible and non-eligible programs
    const eligiblePrograms = allPrograms.filter(program => program.eligible);
    const nonEligiblePrograms = allPrograms.filter(program => !program.eligible);

    const endTime = performance.now();
    console.log(`✅ getTariffSections completed in ${(endTime - startTime).toFixed(1)}ms - ${eligiblePrograms.length} eligible, ${nonEligiblePrograms.length} non-eligible programs`);

    return [
      // Tariff Treatment Section
      {
        id: "tariff-treatment",
        title: "Tariff Treatment",
        fields: [
          {
            label: "Beginning Effective Date (most recent date any part of this HTS item's tariff treatment changed)",
            value: formatDate(tariffData.begin_effect_date) || "Not specified"
          },
          {
            label: "Ending Effective Date (date any part of this HTS item is next scheduled for tariff treatment change)",
            value: formatDate(tariffData.end_effective_date) || "Not specified"
          }
        ]
      },

      // Units of Quantity Section - using actual API data
      {
        id: "units-quantity",
        title: "Units of Quantity",
        fields: [
          {
            label: "1st Unit of Quantity (Q1)",
            value: tariffData.quantity_1_code || ""
          },
          {
            label: "2nd Unit of Quantity (Q2)",
            value: tariffData.quantity_2_code || ""
          }
        ]
      },

      // MFN Rates Section
      {
        id: "mfn-rates",
        title: "2024 Normal Trade Relations (NTR) duty rate (formerly known as the Most Favored Nation (MFN) duty rate)",
        fields: [
          {
            label: "MFN Text Rate",
            value: tariffData.mfn_text_rate || "None"
          },
          {
            label: "Duty calculation",
            value: getDutyCalculation(tariffData.mfn_text_rate)
          },
          {
            label: "Ad Valorem (percent of value) component",
            value: formatPercentageRate(tariffData.mfn_ad_val_rate)
          },
          {
            label: "Other duty component",
            value: formatSpecificRate(tariffData.mfn_other_rate || 0)
          },
          {
            label: "Specific (per unit) component",
            value: formatSpecificRate(tariffData.mfn_specific_rate || 0)
          }
        ]
      },

      // Column 2 Rates Section
      {
        id: "col2-rates",
        title: "\"Column 2\" (non-NTR) duty rate (Applies to imports from a small number of countries that do not enjoy NTR duty status)",
        fields: [
          {
            label: "COL2 Text Rate",
            value: tariffData.col2_text_rate || "None"
          },
          {
            label: "Duty calculation",
            value: getDutyCalculation(tariffData.col2_text_rate, true)
          },
          {
            label: "Ad Valorem (percent of value) component",
            value: formatPercentageRate(tariffData.col2_ad_val_rate)
          },
          {
            label: "Other duty component",
            value: formatSpecificRate(tariffData.col2_other_rate || 0)
          },
          {
            label: "Specific (per unit) component",
            value: formatSpecificRate(tariffData.col2_specific_rate || 0)
          }
        ]
      },

      // Preferential Programs Section - matching US Gov website exactly
      {
        id: "preferential-programs",
        title: "Preferential (duty-free or reduced rate) tariff program applicability to this HTS item",
        fields: allPrograms.map(program => ({
          label: program.label,
          status: program.status,
          adValRate: program.eligible ? formatPercentageRate(program.adValRate) : "",
          specificRate: "", // Would need API fields for specific rates
          otherRate: "", // Would need API fields for other rates
          eligible: program.eligible,
          indicator: program.indicator,
          countries: program.countries
        }))
      },


      // Additional Information Section
      ...(tariffData.footnote_comment ? [{
        id: "additional-info",
        title: "Additional Information",
        fields: [{
          label: "Footnote",
          value: tariffData.footnote_comment
        }]
      }] : []),

      // External Resources Section
      {
        id: "external-resources",
        title: "External Resources",
        content: (
          <div className="space-y-2">
            <a
              href={`https://hts.usitc.gov/?query=${hsCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center"
            >
              <ExternalLink size={14} className="mr-1.5" />
              View on USITC Harmonized Tariff Schedule
            </a>
            <CustomButton
              onClick={() => navigate(`/tariff-calculator?hsCode=${hsCode}`)}
              variant="outline"
              size="sm"
              className="flex items-center text-xs w-full justify-center"
            >
              <Calculator size={14} className="mr-1.5" />
              Calculate Duties & Fees
            </CustomButton>
          </div>
        )
      }
    ];
  }, [tariffData, hsCode, navigate]);

  // Update state when preloaded data changes
  useEffect(() => {
    if (preloadedData) {
      console.log("Using pre-loaded tariff data:", preloadedData);
      setTariffData(preloadedData);
      setLoading(false);
      setError(null);
    } else if (preloadError) {
      console.log("Using pre-load error:", preloadError);
      setError(preloadError);
      setLoading(false);
      setTariffData(null);
    } else if (preloadIsLoading) {
      console.log("Pre-loading in progress...");
      setLoading(true);
      setError(null);
    }
  }, [preloadedData, preloadError, preloadIsLoading]);

  useEffect(() => {
    // Only fetch if we don't have preloaded data and aren't currently preloading
    if (!preloadedData && !preloadIsLoading && !preloadError) {
      const fetchTariffInfo = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Validate HS code format before making the API call
          if (!hsCode || hsCode.trim() === "") {
            setError("Please provide a valid HS code");
            return;
          }
          
          console.log("Fetching tariff data (fallback):", hsCode);
          const data = await getTariffInfo(hsCode);
          console.log("Received tariff data:", data);
          
          // Check if the data is valid
          if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            setError(`No tariff information found for HS code: ${hsCode}`);
            return;
          }
          
          // Check if the required fields are present
          if (!data.hts8) {
            setError(`Invalid tariff data received for HS code: ${hsCode}`);
            console.error("Invalid tariff data:", data);
            return;
          }
          
          setTariffData(data);
        } catch (err: any) {
          setError(`Error fetching tariff information: ${err.message}`);
          console.error("Tariff fetch error:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchTariffInfo();
    }
  }, [hsCode, preloadedData, preloadIsLoading, preloadError]);

  // Function to fetch AI explanation of tariff
  const fetchTariffExplanation = async () => {
    try {
      setLoadingExplanation(true);
      setExplanationError(null);
      
      // If we already have explanation, toggle visibility
      if (explanation) {
        setExplanation(null);
        return;
      }
      
      // Make sure we have tariff data before requesting an explanation
      if (!tariffData) {
        throw new Error("No tariff data available to explain");
      }
      
      console.log("Requesting explanation for HS code:", hsCode);
      const explanationText = await explainTariff(hsCode, true, 'medium');
      
      // Validate the explanation text
      if (!explanationText || explanationText.trim() === "") {
        throw new Error("Received empty explanation from the API");
      }
      
      console.log("Received explanation:", explanationText);
      setExplanation(explanationText);
    } catch (err: any) {
      setExplanationError(`Error getting explanation: ${err.message}`);
      console.error("Tariff explanation error:", err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Function to extract HS codes from footnote text
  const extractHsCode = (text: string | null | undefined): string | null => {
    // Handle null or undefined text
    if (!text) return null;
    
    // Handle "nan" or "NaN" strings
    if (text.toLowerCase() === "nan" || text.toLowerCase() === "null") {
      return null;
    }
    
    // Look for patterns like "See 9903.88.03." in the text
    const match = text.match(/See (\d{4}\.\d{2}\.\d{2})/i);
    
    // Also look for patterns in the special text like "(AU)"
    if (!match && tariffData?.col1_special_text) {
      // Extract country codes from special text
      const countryMatch = text.match(/\(([A-Z]{2})\)/);
      if (countryMatch && countryMatch[1]) {
        const countryCode = countryMatch[1];
        // Check if this country has a specific indicator in the tariff data
        const countryField = `${countryCode.toLowerCase()}_indicator`;
        if (tariffData[countryField as keyof TariffData]) {
          return countryCode;
        }
      }
    }
    
    return match ? match[1] : null;
  };

  // Function to fetch footnote reference information
  const fetchFootnoteReference = async (footnoteText: string | null | undefined) => {
    // Handle null or undefined text
    if (!footnoteText) return;
    
    // Handle "nan" or "NaN" strings
    if (typeof footnoteText === "string" && 
        (footnoteText.toLowerCase() === "nan" || footnoteText.toLowerCase() === "null")) {
      return;
    }
    
    const hsCode = extractHsCode(footnoteText);
    
    if (!hsCode) return;
    
    // If we already have this reference and it's not in loading state, toggle visibility
    if (footnoteReferences[hsCode] && !footnoteReferences[hsCode].loading) {
      setFootnoteReferences(prev => {
        const newRefs = { ...prev };
        delete newRefs[hsCode];
        return newRefs;
      });
      return;
    }
    
    // Initialize loading state
    setFootnoteReferences(prev => ({
      ...prev,
      [hsCode]: { code: hsCode, data: null, loading: true, error: null }
    }));
    
    try {
      const data = await getTariffInfo(hsCode);
      setFootnoteReferences(prev => ({
        ...prev,
        [hsCode]: { code: hsCode, data, loading: false, error: null }
      }));
    } catch (err: any) {
      setFootnoteReferences(prev => ({
        ...prev,
        [hsCode]: { 
          code: hsCode, 
          data: null, 
          loading: false, 
          error: `Error fetching reference: ${err.message}` 
        }
      }));
    }
  };

  if (loading) {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Loading tariff information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-destructive">Unable to load tariff information</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tariffData) {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-muted-foreground">No tariff information available for this HS code.</p>
        </div>
      </div>
    );
  }

  // Get organized tariff sections for display - getTariffSections is already memoized
  const tariffSections = getTariffSections;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center">
        <h3 className="font-medium">Tariff Information for {hsCode}</h3>
        <CustomButton
          onClick={fetchTariffExplanation}
          variant={explanation ? "default" : "outline"}
          size="sm"
          className="flex items-center text-xs"
          disabled={loadingExplanation}
        >
          {loadingExplanation ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              Getting Explanation...
            </>
          ) : (
            <>
              <LightbulbIcon size={14} className="mr-1.5" />
              {explanation ? "Hide Explanation" : "Explain Tariff"}
            </>
          )}
        </CustomButton>
      </div>

      <div className="p-4 space-y-6">
        {/* AI-Generated Explanation */}
        {explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 animate-fade-in">
            <div className="flex items-start">
              <BookOpen className="h-5 w-5 text-blue-500 mr-2 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Tariff Explanation</h4>
                <div className="text-sm text-blue-800 prose-sm">
                  {explanation.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => (
                    <p key={idx} className="mb-2">{paragraph}</p>
                  ))}

                  {/* Add a note about the explanation being AI-generated */}
                  <p className="mt-4 text-xs text-blue-600 italic">
                    This explanation was generated by AI and may not reflect all legal nuances of tariff classification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display error if there is one */}
        {(error || explanationError) && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Unable to load tariff data</h4>
                <p className="text-sm mt-1">{error || explanationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Render sections dynamically */}
        {tariffSections.map((section, sectionIndex) => (
          <div key={section.id} className="space-y-3">
            <div>
              <h4 className="text-base font-medium border-b pb-2">{section.title}</h4>
            {(section as any).subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{(section as any).subtitle}</p>
              )}
            </div>
            
            {/* Render content if it exists */}
            {section.content && section.content}
            
            {/* Render fields if they exist */}
            {section.fields && section.fields.length > 0 && (
              <div className={cn(
                "grid gap-3",
                section.id === "units-quantity" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className={cn(
                    (section.id === "special-programs" || section.id === "all-trade-agreements" || section.id === "preferential-programs") ? "space-y-0" : "space-y-1"
                  )}>
                    {(section.id === "special-programs" || section.id === "all-trade-agreements" || section.id === "preferential-programs") ? (
                      // Special rendering for trade programs
                      <div className={cn(
                        "border rounded-md overflow-hidden",
                        field.eligible ? "border-green-200" : "border-muted"
                      )}>
                        <div className={cn(
                          "px-3 py-2 border-b",
                          field.eligible ? "bg-green-50 border-green-200" : "bg-muted/30 border-muted"
                        )}>
                          <h5 className={cn(
                            "font-medium text-sm",
                            field.eligible ? "text-green-800" : "text-muted-foreground"
                          )}>
                            {field.label}
                          </h5>
                        </div>
                        <div className="p-3 space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Status:</span>{" "}
                            <span className={field.eligible ? "text-green-700" : "text-muted-foreground"}>
                              {field.status}
                            </span>
                          </div>
                          {field.eligible && field.value !== "None" && field.value !== "Not Applicable" && (
                            <div>
                              <span className="font-medium">Ad Valorem Rate:</span>{" "}
                              <span className="text-green-700">{field.value}</span>
                            </div>
                          )}
                          {field.indicator && field.indicator.trim() !== "" && field.indicator.toLowerCase() !== "nan" && (
                            <div>
                              <span className="font-medium">Indicator Code:</span>{" "}
                              <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{field.indicator}</span>
                            </div>
                          )}
                          {field.countries && (
                            <div>
                              <span className="font-medium">Countries/Regions:</span>{" "}
                              <span className="text-muted-foreground">{field.countries}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Standard field rendering
                      <>
                        <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                        {field.subtitle && (
                          <p className="text-xs text-muted-foreground mb-1">{field.subtitle}</p>
                        )}
                        <div className={cn(
                          "text-sm p-3 rounded-md break-words",
                          field.value !== "None" && field.label === "MFN Text Rate"
                            ? "bg-primary/10 text-primary font-medium"
                            : field.value !== "None" && field.label === "COL2 Text Rate"
                            ? "bg-destructive/10 text-destructive font-medium"
                            : "bg-muted/30"
                        )}>
                          {field.value}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Special Rate Text for MFN section */}
            {section.id === "mfn-rates" && tariffData && tariffData.col1_special_text && (
              <div className="mt-3 border border-blue-200 bg-blue-50 rounded-lg p-3">
                <h5 className="text-sm font-medium text-blue-700 mb-2">Special Rate Information</h5>
                <p className="text-sm text-blue-800">{tariffData.col1_special_text}</p>

                {/* Extract country codes from special text for reference */}
                {tariffData.col1_special_text.includes("(") && (
                  <div className="mt-3 text-xs text-blue-600">
                    <p className="font-medium mb-1">Country/Program Codes:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Array.from(tariffData.col1_special_text.matchAll(/\(([A-Z\*,]+)\)/g)).map((match, idx) => {
                        const codes = match[1].split(',');
                        return codes.map((code, codeIdx) => (
                          <div key={`${idx}-${codeIdx}`} className="bg-white/50 px-2 py-1 rounded border border-blue-100">
                            {code}
                          </div>
                        ));
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* If there's a footnote_comment but it wasn't included in sections */}
        {tariffData && tariffData.footnote_comment &&
         !tariffSections.some(section => section.id === "additional-info") && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">Footnotes</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <p className="text-sm bg-muted/30 p-3 rounded-md">{tariffData.footnote_comment}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footnote References */}
        {footnoteReferences && Object.keys(footnoteReferences).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">Referenced HS Codes</h4>
            <div className="space-y-4">
              {Object.entries(footnoteReferences).map(([code, reference]) => (
                <div key={code} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-3 py-2 border-b border-border flex justify-between items-center">
                    <h5 className="font-medium text-sm">{code}</h5>
                    {reference && reference.loading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    {reference && reference.loading ? (
                      <div className="text-xs text-muted-foreground">Loading reference...</div>
                    ) : reference && reference.error ? (
                      <div className="text-xs text-destructive">
                        {reference.error}
                      </div>
                    ) : reference && reference.data ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Description:</span>{" "}
                          {reference.data.brief_description || "No description available"}
                        </div>
                        {reference.data.mfn_text_rate && (
                          <div>
                            <span className="font-medium">MFN Rate:</span>{" "}
                            {reference.data.mfn_text_rate}
                          </div>
                        )}
                        {reference.data.col1_special_text && (
                          <div>
                            <span className="font-medium">Special Rate:</span>{" "}
                            {reference.data.col1_special_text}
                          </div>
                        )}
                        {reference.data.begin_effect_date && (
                          <div>
                            <span className="font-medium">Effective From:</span>{" "}
                            {formatDate(reference.data.begin_effect_date)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No reference data available</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TariffInfo;
