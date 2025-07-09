import React, { useState, useEffect, useMemo } from "react";
import { getTariffInfo, explainTariff } from "@/lib/classifierService";
import { Loader2, AlertCircle, ExternalLink, BookOpen, LightbulbIcon, Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";

interface TariffInfoProps {
  hsCode: string;
  className?: string;
  preloadedData?: TariffData | null;
  isLoading?: boolean;
  preloadError?: string | null;
}

// Updated interface to match actual API response
interface TariffData {
  hts8: string | number;
  brief_description?: string;
  quantity_1_code?: string;
  quantity_2_code?: string;
  wto_binding_code?: string;
  
  // MFN (Column 1 General) rates
  mfn_text_rate?: string;
  mfn_rate_type_code?: string | number;
  mfn_ad_val_rate?: number;
  mfn_specific_rate?: number;
  mfn_other_rate?: number;
  
  // Column 1 Special rates
  col1_special_text?: string;
  
  // Column 2 rates
  col2_text_rate?: string;
  col2_rate_type_code?: string | number;
  col2_ad_val_rate?: number;
  col2_specific_rate?: number;
  col2_other_rate?: number;
  
  // Date fields
  begin_effect_date?: string;
  end_effective_date?: string;
  footnote_comment?: string;
  
  // Trade program indicators - using actual API field names
  gsp_indicator?: string;
  gsp_ctry_excluded?: string; // Countries excluded from GSP
  
  // NAFTA/USMCA
  nafta_canada_ind?: string;
  nafta_mexico_ind?: string;
  mexico_rate_type_code?: string | number;
  mexico_ad_val_rate?: number;
  mexico_specific_rate?: number;
  usmca_indicator?: string;
  usmca_rate_type_code?: number;
  usmca_ad_val_rate?: number;
  usmca_specific_rate?: number;
  usmca_other_rate?: number;
  
  // Other trade programs
  cbi_indicator?: string;
  cbi_ad_val_rate?: number;
  cbi_specific_rate?: number;
  
  agoa_indicator?: string;
  
  israel_fta_indicator?: string;
  
  jordan_indicator?: string;
  jordan_rate_type_code?: number;
  jordan_ad_val_rate?: number;
  jordan_specific_rate?: number;
  jordan_other_rate?: number;
  
  singapore_indicator?: string;
  singapore_rate_type_code?: number;
  singapore_ad_val_rate?: number;
  singapore_specific_rate?: number;
  singapore_other_rate?: number;
  
  chile_indicator?: string;
  chile_rate_type_code?: number;
  chile_ad_val_rate?: number;
  chile_specific_rate?: number;
  chile_other_rate?: number;
  
  morocco_indicator?: string;
  morocco_rate_type_code?: number;
  morocco_ad_val_rate?: number;
  morocco_specific_rate?: number;
  morocco_other_rate?: number;
  
  australia_indicator?: string;
  australia_rate_type_code?: number;
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
  oman_rate_type_code?: number;
  oman_ad_val_rate?: number;
  oman_specific_rate?: number;
  oman_other_rate?: number;
  
  peru_indicator?: string;
  peru_rate_type_code?: number;
  peru_ad_val_rate?: number;
  peru_specific_rate?: number;
  peru_other_rate?: number;
  
  korea_indicator?: string;
  korea_rate_type_code?: number;
  korea_ad_val_rate?: number;
  korea_specific_rate?: number;
  korea_other_rate?: number;
  
  colombia_indicator?: string;
  colombia_rate_type_code?: number;
  colombia_ad_val_rate?: number;
  colombia_specific_rate?: number;
  colombia_other_rate?: number;
  
  panama_indicator?: string;
  panama_rate_type_code?: string | number;
  panama_ad_val_rate?: number;
  panama_specific_rate?: number;
  panama_other_rate?: number;
  
  // Additional fields from API
  requested_hts_code?: string;
  matched_hts_code?: string;
}

// Format rate values with proper handling
const formatRateValue = (value: number | string | undefined, isPercentage: boolean = false): string => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
    return "None";
  }
  
  if (typeof value === "number") {
    if (value === 0) return isPercentage ? "0%" : "Free";
    if (isPercentage) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return `$${value.toFixed(3)}`;
  }
  
  if (typeof value === "string" && (value.toLowerCase() === "nan" || value.toLowerCase() === "null")) {
    return "None";
  }
  
  return value.toString();
};

// Format specific rates (like cents per kg)
const formatSpecificRate = (value: number | string | undefined): string => {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
    return "$0.000";
  }
  
  if (typeof value === "number") {
    if (value === 0) return "$0.000";
    return `$${value.toFixed(3)}`;
  }
  
  if (typeof value === "string" && (value.toLowerCase() === "nan" || value.toLowerCase() === "null")) {
    return "$0.000";
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
    return `${(value * 100).toFixed(1)}%`;
  }
  
  if (typeof value === "string" && (value.toLowerCase() === "nan" || value.toLowerCase() === "null")) {
    return "0%";
  }
  
  return value.toString();
};

// Get duty calculation description based on text rate
const getDutyCalculation = (textRate: string | undefined, isCol2: boolean = false): string => {
  if (!textRate || textRate.toLowerCase() === "free") {
    return "Duty rate is free. No computation necessary";
  }
  
  if (textRate.includes("cents") || textRate.includes("/kg") || textRate.includes("/lb") || textRate.includes("¢")) {
    return "Specific rate × Quantity (Q1)";
  }
  
  if (textRate.includes("%")) {
    return "Ad Valorem rate × Customs Value";
  }
  
  if (textRate.includes("+")) {
    return "Ad Valorem rate × Customs Value + Specific rate × Quantity";
  }
  
  return "Ad Valorem rate × Customs Value";
};

// Check if a trade program indicator represents eligibility
const isEligible = (indicator?: string): boolean => {
  if (!indicator || indicator.trim() === "" || indicator.toLowerCase() === "nan" || indicator.toLowerCase() === "null") {
    return false;
  }
  
  // Common eligibility indicators from HTS special column
  const eligibleIndicators = [
    // GSP indicators
    'A*', 'A', 'A+',
    // FTA and other program codes
    'AU', 'BH', 'CA', 'CL', 'CO', 'D', 'E', 'IL', 'JO', 'KR', 'MA', 'MX', 'OM', 'P', 'PA', 'PE', 'S', 'SG',
    // Special indicators
    'Free', 'FREE', 'Duty-free', 'DUTY-FREE'
  ];
  
  const cleanIndicator = indicator.trim().toUpperCase();
  
  return eligibleIndicators.some(code => cleanIndicator === code.toUpperCase()) || 
         /^[A-Z*+]{1,3}$/.test(cleanIndicator);
};

// Format dates properly
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

// Trade program configuration matching actual API fields
const TRADE_PROGRAMS = [
  { 
    key: 'gsp_indicator', 
    label: 'GSP (Generalized System of Preferences)', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Developing countries (see GSP country list)',
    exclusionField: 'gsp_ctry_excluded'
  },
  { 
    key: 'agoa_indicator', 
    label: 'AGOA (African Growth and Opportunity Act)', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Sub-Saharan African countries'
  },
  { 
    key: 'cbi_indicator', 
    label: 'CBI (Caribbean Basin Initiative)', 
    rateField: 'cbi_ad_val_rate',
    specificRateField: 'cbi_specific_rate',
    otherRateField: null,
    countries: 'Caribbean Basin countries'
  },
  { 
    key: 'usmca_indicator', 
    label: 'USMCA (United States-Mexico-Canada Agreement)', 
    rateField: 'usmca_ad_val_rate',
    specificRateField: 'usmca_specific_rate',
    otherRateField: 'usmca_other_rate',
    countries: 'Canada, Mexico'
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
    rateField: 'mexico_ad_val_rate',
    specificRateField: 'mexico_specific_rate',
    otherRateField: null,
    countries: 'Mexico'
  },
  { 
    key: 'israel_fta_indicator', 
    label: 'Israel FTA', 
    rateField: null,
    specificRateField: null,
    otherRateField: null,
    countries: 'Israel'
  },
  { 
    key: 'jordan_indicator', 
    label: 'Jordan FTA', 
    rateField: 'jordan_ad_val_rate',
    specificRateField: 'jordan_specific_rate',
    otherRateField: 'jordan_other_rate',
    countries: 'Jordan'
  },
  { 
    key: 'singapore_indicator', 
    label: 'Singapore FTA', 
    rateField: 'singapore_ad_val_rate',
    specificRateField: 'singapore_specific_rate',
    otherRateField: 'singapore_other_rate',
    countries: 'Singapore'
  },
  { 
    key: 'chile_indicator', 
    label: 'Chile FTA', 
    rateField: 'chile_ad_val_rate',
    specificRateField: 'chile_specific_rate',
    otherRateField: 'chile_other_rate',
    countries: 'Chile'
  },
  { 
    key: 'australia_indicator', 
    label: 'Australia FTA', 
    rateField: 'australia_ad_val_rate',
    specificRateField: 'australia_specific_rate',
    otherRateField: 'australia_other_rate',
    countries: 'Australia'
  },
  { 
    key: 'morocco_indicator', 
    label: 'Morocco FTA', 
    rateField: 'morocco_ad_val_rate',
    specificRateField: 'morocco_specific_rate',
    otherRateField: 'morocco_other_rate',
    countries: 'Morocco'
  },
  { 
    key: 'bahrain_indicator', 
    label: 'Bahrain FTA', 
    rateField: 'bahrain_ad_val_rate',
    specificRateField: 'bahrain_specific_rate',
    otherRateField: 'bahrain_other_rate',
    countries: 'Bahrain'
  },
  { 
    key: 'dr_cafta_indicator', 
    label: 'CAFTA-DR (Dominican Republic-Central America FTA)', 
    rateField: 'dr_cafta_ad_val_rate',
    specificRateField: 'dr_cafta_specific_rate',
    otherRateField: 'dr_cafta_other_rate',
    countries: 'Costa Rica, Dominican Republic, El Salvador, Guatemala, Honduras, Nicaragua'
  },
  { 
    key: 'oman_indicator', 
    label: 'Oman FTA', 
    rateField: 'oman_ad_val_rate',
    specificRateField: 'oman_specific_rate',
    otherRateField: 'oman_other_rate',
    countries: 'Oman'
  },
  { 
    key: 'peru_indicator', 
    label: 'Peru FTA', 
    rateField: 'peru_ad_val_rate',
    specificRateField: 'peru_specific_rate',
    otherRateField: 'peru_other_rate',
    countries: 'Peru'
  },
  { 
    key: 'korea_indicator', 
    label: 'Korea FTA', 
    rateField: 'korea_ad_val_rate',
    specificRateField: 'korea_specific_rate',
    otherRateField: 'korea_other_rate',
    countries: 'South Korea'
  },
  { 
    key: 'colombia_indicator', 
    label: 'Colombia FTA', 
    rateField: 'colombia_ad_val_rate',
    specificRateField: 'colombia_specific_rate',
    otherRateField: 'colombia_other_rate',
    countries: 'Colombia'
  },
  { 
    key: 'panama_indicator', 
    label: 'Panama FTA', 
    rateField: 'panama_ad_val_rate',
    specificRateField: 'panama_specific_rate',
    otherRateField: 'panama_other_rate',
    countries: 'Panama'
  }
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
  const router = useRouter();

  // Memoized function to organize tariff data into logical sections
  const getTariffSections = useMemo(() => {
    if (!tariffData) return [];
    
    console.log(`🧮 Computing tariff sections for HTS ${tariffData.hts8}...`);
    const startTime = performance.now();

    // Build trade programs from API data
    const allPrograms = TRADE_PROGRAMS.map(program => {
      const indicator = tariffData[program.key as keyof TariffData] as string;
      const adValRate = program.rateField ? tariffData[program.rateField as keyof TariffData] as number : undefined;
      const specificRate = program.specificRateField ? tariffData[program.specificRateField as keyof TariffData] as number : undefined;
      const otherRate = program.otherRateField ? tariffData[program.otherRateField as keyof TariffData] as number : undefined;
      
      let status = "Not Eligible";
      let exclusionNote = "";
      
      if (isEligible(indicator)) {
        status = `Eligible (${indicator})`;
        
        // Check for GSP country exclusions
        if (program.key === 'gsp_indicator' && tariffData.gsp_ctry_excluded) {
          exclusionNote = `Countries excluded: ${tariffData.gsp_ctry_excluded}`;
        }
      }
      
      return {
        label: program.label,
        status: status,
        adValRate: adValRate || 0,
        specificRate: specificRate || 0,
        otherRate: otherRate || 0,
        eligible: isEligible(indicator),
        indicator: indicator,
        countries: program.countries,
        exclusionNote: exclusionNote
      };
    });

    // Separate eligible and non-eligible programs
    const eligiblePrograms = allPrograms.filter(program => program.eligible);
    const nonEligiblePrograms = allPrograms.filter(program => !program.eligible);

    const endTime = performance.now();
    console.log(`✅ getTariffSections completed in ${(endTime - startTime).toFixed(1)}ms - ${eligiblePrograms.length} eligible, ${nonEligiblePrograms.length} non-eligible programs`);

    return [
      // Product Information Section
      {
        id: "product-info",
        title: `HTS ${tariffData.hts8} - Product Information`,
        fields: [
          {
            label: "HTS Code",
            value: tariffData.hts8?.toString() || "Not available"
          },
          {
            label: "Description",
            value: tariffData.brief_description || "No description available"
          },
          {
            label: "WTO Binding",
            value: tariffData.wto_binding_code || "Not specified"
          }
        ]
      },

      // Effective Dates Section
      {
        id: "effective-dates",
        title: "Effective Dates",
        fields: [
          {
            label: "Begin Effective Date",
            value: formatDate(tariffData.begin_effect_date) || "Not specified"
          },
          {
            label: "End Effective Date",
            value: formatDate(tariffData.end_effective_date) || "Not specified"
          }
        ]
      },

      // Units of Quantity Section
      {
        id: "units-quantity",
        title: "Units of Quantity",
        fields: [
          {
            label: "1st Unit of Quantity (Q1)",
            value: tariffData.quantity_1_code || "Not specified"
          },
          {
            label: "2nd Unit of Quantity (Q2)",
            value: tariffData.quantity_2_code || "Not specified"
          }
        ]
      },

      // Column 1 General (MFN/NTR) Rates Section
      {
        id: "col1-general-rates",
        title: "Column 1 - General (Normal Trade Relations / Most Favored Nation)",
        subtitle: "Applies to imports from WTO member countries and other countries with NTR status",
        fields: [
          {
            label: "MFN Text Rate",
            value: tariffData.mfn_text_rate || "Free"
          },
          {
            label: "Duty Calculation Method",
            value: getDutyCalculation(tariffData.mfn_text_rate)
          },
          {
            label: "Ad Valorem Component",
            value: formatPercentageRate(tariffData.mfn_ad_val_rate)
          },
          {
            label: "Specific Component",
            value: formatSpecificRate(tariffData.mfn_specific_rate)
          },
          {
            label: "Other Component",
            value: formatSpecificRate(tariffData.mfn_other_rate)
          }
        ]
      },

      // Column 1 Special Rates Section
      {
        id: "col1-special-rates",
        title: "Column 1 - Special (Preferential Programs)",
        subtitle: "Reduced or duty-free rates available under various trade preference programs",
        fields: [
          {
            label: "Special Rate Text",
            value: tariffData.col1_special_text || "No special rates available"
          }
        ]
      },

      // Column 2 Rates Section
      {
        id: "col2-rates",
        title: "Column 2 (Non-NTR Countries)",
        subtitle: "Higher penalty rates for countries without Normal Trade Relations status (Belarus, Cuba, North Korea, Russia)",
        fields: [
          {
            label: "Column 2 Text Rate",
            value: tariffData.col2_text_rate || "Not specified"
          },
          {
            label: "Duty Calculation Method",
            value: getDutyCalculation(tariffData.col2_text_rate, true)
          },
          {
            label: "Ad Valorem Component",
            value: formatPercentageRate(tariffData.col2_ad_val_rate)
          },
          {
            label: "Specific Component",
            value: formatSpecificRate(tariffData.col2_specific_rate)
          },
          {
            label: "Other Component",
            value: formatSpecificRate(tariffData.col2_other_rate)
          }
        ]
      },

      // Trade Preference Programs Section
      {
        id: "trade-programs",
        title: "Trade Preference Programs",
        subtitle: "Eligibility for duty-free or reduced-rate treatment under various trade agreements and preference programs",
        fields: allPrograms.map(program => ({
          label: program.label,
          status: program.status,
          adValRate: program.eligible && program.adValRate > 0 ? formatPercentageRate(program.adValRate) : "",
          specificRate: program.eligible && program.specificRate > 0 ? formatSpecificRate(program.specificRate) : "",
          otherRate: program.eligible && program.otherRate > 0 ? formatSpecificRate(program.otherRate) : "",
          eligible: program.eligible,
          indicator: program.indicator,
          countries: program.countries,
          exclusionNote: program.exclusionNote
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
        title: "External Resources & Tools",
        content: (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                href={`https://hts.usitc.gov/?query=${hsCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center p-3 border border-border rounded-md hover:bg-muted/50 transition-colors"
              >
                <ExternalLink size={16} className="mr-2 shrink-0" />
                <div>
                  <div className="font-medium">USITC HTS Database</div>
                  <div className="text-xs text-muted-foreground">Official tariff classification lookup</div>
                </div>
              </a>
                <CustomButton
                  onClick={() => router.push(`/tariff-calculator?hsCode=${hsCode}`)}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-start p-3 h-auto"
                >
                <Calculator size={16} className="mr-2 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Calculate Duties</div>
                  <div className="text-xs text-muted-foreground">Estimate total import costs</div>
                </div>
              </CustomButton>
            </div>
          </div>
        )
      }
    ];
  }, [tariffData, hsCode, router]);

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
    if (!text) return null;
    
    if (text.toLowerCase() === "nan" || text.toLowerCase() === "null") {
      return null;
    }
    
    // Look for patterns like "See 9903.88.03." in the text
    const match = text.match(/See (\d{4}\.\d{2}\.\d{2})/i);
    return match ? match[1] : null;
  };

  // Function to fetch footnote reference information
  const fetchFootnoteReference = async (footnoteText: string | null | undefined) => {
    if (!footnoteText) return;
    
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start">
              <BookOpen className="h-5 w-5 text-blue-500 mr-2 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-700 mb-2">AI Tariff Explanation</h4>
                <div className="text-sm text-blue-800 prose-sm">
                  {explanation.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => (
                    <p key={idx} className="mb-2">{paragraph}</p>
                  ))}
                  <p className="mt-4 text-xs text-blue-600 italic">
                    This explanation was generated by AI and should be verified against official sources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display error if there is one */}
        {explanationError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Error Loading Explanation</h4>
                <p className="text-sm mt-1">{explanationError}</p>
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
                section.id === "units-quantity" || section.id === "effective-dates" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className={cn(
                    section.id === "trade-programs" ? "space-y-0" : "space-y-1"
                  )}>
                    {section.id === "trade-programs" ? (
                      // Special rendering for trade programs
                      <div className={cn(
                        "border rounded-md overflow-hidden",
                        field.eligible ? "border-green-200 bg-green-50/30" : "border-muted bg-muted/10"
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
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Status:</span>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              field.eligible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                            )}>
                              {field.status}
                            </span>
                          </div>
                          
                          {field.eligible && (
                            <>
                              {field.adValRate && field.adValRate !== "0%" && (
                                <div>
                                  <span className="font-medium">Ad Valorem Rate:</span>{" "}
                                  <span className="text-green-700 font-mono">{field.adValRate}</span>
                                </div>
                              )}
                              {field.specificRate && field.specificRate !== "$0.000" && (
                                <div>
                                  <span className="font-medium">Specific Rate:</span>{" "}
                                  <span className="text-green-700 font-mono">{field.specificRate}</span>
                                </div>
                              )}
                              {field.otherRate && field.otherRate !== "$0.000" && (
                                <div>
                                  <span className="font-medium">Other Rate:</span>{" "}
                                  <span className="text-green-700 font-mono">{field.otherRate}</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {field.indicator && field.indicator.trim() !== "" && field.indicator.toLowerCase() !== "nan" && (
                            <div>
                              <span className="font-medium">Indicator Code:</span>{" "}
                              <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{field.indicator}</span>
                            </div>
                          )}
                          
                          {field.countries && (
                            <div>
                              <span className="font-medium">Eligible Countries:</span>{" "}
                              <span className="text-muted-foreground text-xs">{field.countries}</span>
                            </div>
                          )}
                          
                          {field.exclusionNote && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <span className="font-medium text-yellow-800">Note:</span>{" "}
                              <span className="text-yellow-700">{field.exclusionNote}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Standard field rendering
                      <>
                        <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                        <div className={cn(
                          "text-sm p-3 rounded-md break-words",
                          // Highlight important rate fields
                          field.label === "MFN Text Rate" && field.value !== "Free" && field.value !== "None"
                            ? "bg-primary/10 text-primary font-medium border border-primary/20"
                            : field.label === "Column 2 Text Rate" && field.value !== "None"
                            ? "bg-destructive/10 text-destructive font-medium border border-destructive/20"
                            : field.label === "Special Rate Text" && field.value !== "No special rates available"
                            ? "bg-blue/10 text-blue-700 font-medium border border-blue/20"
                            : "bg-muted/30 border border-muted"
                        )}>
                          {field.value}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

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
