import React, { useState, useEffect, useCallback } from "react";
import { getTariffInfo, explainTariff } from "@/lib/classifierService";
import { Loader2, AlertCircle, ExternalLink, BookOpen, LightbulbIcon, Calculator, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";

interface TariffInfoProps {
  hsCode: string;
  className?: string;
}

// Define a proper interface for the tariff data
interface TariffData {
  hts8: string | number;
  brief_description?: string;
  col1_special_text?: string;
  mfn_text_rate?: string;
  mfn_rate_type_code?: string | number;
  mfn_ad_val_rate?: number;
  mfn_specific_rate?: number;
  mfn_other_rate?: number;
  col2_text_rate?: string;
  col2_rate_type_code?: string | number;
  col2_ad_val_rate?: number;
  col2_specific_rate?: number;
  col2_other_rate?: number;
  begin_effect_date?: string;
  end_effective_date?: string;
  footnote_comment?: string;
  additional_duty?: string;
  
  // Special program indicators
  usmca_indicator?: string;
  usmca_ad_val_rate?: number;
  korea_indicator?: string;
  korea_ad_val_rate?: number;
  australia_indicator?: string;
  australia_ad_val_rate?: number;
  singapore_indicator?: string;
  singapore_ad_val_rate?: number;
  chile_indicator?: string;
  chile_ad_val_rate?: number;
  israel_fta_indicator?: string;
  israel_fta_ad_val_rate?: number;
  jordan_indicator?: string;
  jordan_ad_val_rate?: number;
  bahrain_indicator?: string;
  bahrain_ad_val_rate?: number;
  oman_indicator?: string;
  oman_ad_val_rate?: number;
  peru_indicator?: string;
  peru_ad_val_rate?: number;
  columbia_indicator?: string;
  columbia_ad_val_rate?: number;
  panama_indicator?: string;
  panama_ad_val_rate?: number;
  dr_cafta_indicator?: string;
  dr_cafta_ad_val_rate?: number;
  morocco_indicator?: string;
  morocco_ad_val_rate?: number;
}

interface FootnoteReference {
  code: string;
  data: any;
  loading: boolean;
  error: string | null;
}

// Helper function to format rate values
const formatRateValue = (value: number | string | undefined): string => {
  // Handle undefined, null, or NaN values
  if (value === undefined || value === null || 
      (typeof value === 'number' && isNaN(value))) {
    return "None";
  }
  
  if (typeof value === "number") {
    // Format as percentage if it's a decimal less than 1
    if (value < 1 && value > 0) return `${(value * 100).toFixed(1)}%`;
    // Format as dollar amount if it's a specific rate
    return `$${value.toFixed(2)}`;
  }
  
  // Handle string "nan" or "NaN" values that might come from the API
  if (typeof value === "string" && 
      (value.toLowerCase() === "nan" || value.toLowerCase() === "null")) {
    return "None";
  }
  
  return value.toString();
};

// Helper function to determine if a country/program is eligible based on indicator
const isEligible = (indicator?: string): boolean => {
  // Check if indicator exists, is not empty, and is not "nan" or "NaN"
  return !!indicator && 
         indicator.trim() !== "" && 
         indicator.toLowerCase() !== "nan" &&
         indicator.toLowerCase() !== "null";
};

// Helper function to get eligibility status text
const getEligibilityStatus = (indicator?: string): string => {
  if (!indicator) return "Not Eligible";
  return `Eligible: code "${indicator}"`;
};

// Helper function to format date strings
const formatDate = (dateStr?: string | any): string => {
  if (!dateStr) return "";
  
  // Handle "nan" or "NaN" strings
  if (typeof dateStr === "string" && 
      (dateStr.toLowerCase() === "nan" || dateStr.toLowerCase() === "null")) {
    return "";
  }
  
  // Handle Timestamp objects from pandas (which might come as strings like "Timestamp('2020-07-01 00:00:00')")
  if (typeof dateStr === "string" && dateStr.includes("Timestamp(")) {
    // Extract the date part from the Timestamp string
    const match = dateStr.match(/Timestamp\('(\d{4}-\d{2}-\d{2})/);
    if (match && match[1]) {
      dateStr = match[1];
    }
  }
  
  try {
    // Try to create a Date object from the string
    const date = new Date(dateStr);
    
    // Check if the date is valid
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
  
  // If all else fails, return the original string
  return typeof dateStr === "string" ? dateStr : "";
};

const TariffInfo: React.FC<TariffInfoProps> = ({ hsCode, className }) => {
  const [tariffData, setTariffData] = useState<TariffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [footnoteReferences, setFootnoteReferences] = useState<Record<string, FootnoteReference>>({});
  const navigate = useNavigate();

  // Function to organize tariff data into logical sections for display
  const getTariffSections = (data: TariffData) => {
    if (!data) return [];

    // Create an array of all trade programs with their eligibility status
    const allTradePrograms = [
      // GSP (Generalized System of Preferences)
      {
        label: "GSP (Generalized System of Preferences)",
        status: isEligible(data.usmca_indicator) && data.usmca_indicator === "A*"
          ? `Eligible: code "A*" (Certain Countries Excluded)`
          : "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.usmca_indicator) && data.usmca_indicator === "A*"
      },
      // Civil Aircraft Agreement
      {
        label: "Civil Aircraft Agreement Preference",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      },
      // Tariff concession on Dyes
      {
        label: "Tariff concession on Dyes",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      },
      // CBI or CBERA (Caribbean Basin Initiative)
      {
        label: "CBI or CBERA (Caribbean Basin Initiative) Preference",
        status: isEligible(data.usmca_indicator) && data.usmca_indicator === "E"
          ? `Eligible: code "E"`
          : "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.usmca_indicator) && data.usmca_indicator === "E"
      },
      // AGOA (African Growth and Opportunity Act)
      {
        label: "AGOA (African Growth and Opportunity Act)",
        status: isEligible(data.usmca_indicator) && data.usmca_indicator === "D"
          ? `Eligible: code "D"`
          : "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.usmca_indicator) && data.usmca_indicator === "D"
      },
      // CBTPA (Caribbean Basin Trade Partnership Act)
      {
        label: "CBTPA (Caribbean Basin Trade Partnership Act)",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      },
      // Morocco
      {
        label: "Morocco FTA Preference",
        status: isEligible(data.morocco_indicator)
          ? `Eligible: code "${data.morocco_indicator}"`
          : "Not Eligible",
        adValRate: data.morocco_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.morocco_indicator)
      },
      // Jordan
      {
        label: "Jordan FTA Preference",
        status: isEligible(data.jordan_indicator)
          ? `Eligible: code "${data.jordan_indicator}"`
          : "Not Eligible",
        adValRate: data.jordan_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.jordan_indicator)
      },
      // Singapore
      {
        label: "Singapore FTA Preference",
        status: isEligible(data.singapore_indicator)
          ? `Eligible: code "${data.singapore_indicator}"`
          : "Not Eligible",
        adValRate: data.singapore_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.singapore_indicator)
      },
      // Chile
      {
        label: "Chile FTA Preference",
        status: isEligible(data.chile_indicator)
          ? `Eligible: code "${data.chile_indicator}"`
          : "Not Eligible",
        adValRate: data.chile_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.chile_indicator)
      },
      // Australia
      {
        label: "Australia FTA Preference",
        status: isEligible(data.australia_indicator)
          ? `Eligible: code "${data.australia_indicator}"`
          : "Not Eligible",
        adValRate: data.australia_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.australia_indicator)
      },
      // Bahrain
      {
        label: "Bahrain FTA Preference",
        status: isEligible(data.bahrain_indicator)
          ? `Eligible: code "${data.bahrain_indicator}"`
          : "Not Eligible",
        adValRate: data.bahrain_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.bahrain_indicator)
      },
      // DR-CAFTA
      {
        label: "CAFTA FTA Preference",
        status: isEligible(data.dr_cafta_indicator)
          ? `Eligible: code "${data.dr_cafta_indicator}"`
          : "Not Eligible",
        adValRate: data.dr_cafta_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.dr_cafta_indicator)
      },
      // CAFTA PLUS
      {
        label: "CAFTA PLUS FTA Preference",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      },
      // Oman
      {
        label: "Oman FTA Preference",
        status: isEligible(data.oman_indicator)
          ? `Eligible: code "${data.oman_indicator}"`
          : "Not Eligible",
        adValRate: data.oman_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.oman_indicator)
      },
      // Peru
      {
        label: "Peru FTA Preference",
        status: isEligible(data.peru_indicator)
          ? `Eligible: code "${data.peru_indicator}"`
          : "Not Eligible",
        adValRate: data.peru_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.peru_indicator)
      },
      // Korea
      {
        label: "Korea FTA Preference",
        status: isEligible(data.korea_indicator)
          ? `Eligible: code "${data.korea_indicator}"`
          : "Not Eligible",
        adValRate: data.korea_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.korea_indicator)
      },
      // Japan
      {
        label: "Japan FTA Preference",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      },
      // USMCA (NAFTA replacement)
      {
        label: "USMCA FTA Preference",
        status: isEligible(data.usmca_indicator) && data.usmca_indicator === "S"
          ? `Eligible: code "${data.usmca_indicator}"`
          : "Not Eligible",
        adValRate: data.usmca_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.usmca_indicator) && data.usmca_indicator === "S"
      },
      // Israel
      {
        label: "Israel FTA Preference",
        status: isEligible(data.israel_fta_indicator)
          ? `Eligible: code "${data.israel_fta_indicator}"`
          : "Not Eligible",
        adValRate: data.israel_fta_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.israel_fta_indicator)
      },
      // APTA (Auto Product Agreement)
      {
        label: "APTA (Auto Product Agreement) Preference",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      },
      // ATPA (Andean Agreement)
      {
        label: "ATPA (Andean Agreement) Preference",
        status: isEligible(data.usmca_indicator) && data.usmca_indicator === "A*"
          ? `Eligible: code "A*"`
          : "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.usmca_indicator) && data.usmca_indicator === "A*"
      },
      // Pharmaceutical Agreement
      {
        label: "Pharmaceutical Agreement Preference",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      },
      // NAFTA Canada
      {
        label: "NAFTA Canada Preference",
        status: isEligible(data.usmca_indicator) && data.usmca_indicator === "CA"
          ? `Eligible: code "CA"`
          : "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.usmca_indicator) && data.usmca_indicator === "CA"
      },
      // NAFTA Mexico
      {
        label: "NAFTA Mexico Preference",
        status: isEligible(data.usmca_indicator) && data.usmca_indicator === "MX"
          ? `Eligible: code "MX"`
          : "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.usmca_indicator) && data.usmca_indicator === "MX"
      },
      // Colombia
      {
        label: "Colombia FTA Preference",
        status: isEligible(data.columbia_indicator)
          ? `Eligible: code "${data.columbia_indicator}"`
          : "Not Eligible",
        adValRate: data.columbia_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.columbia_indicator)
      },
      // Panama
      {
        label: "Panama FTA Preference",
        status: isEligible(data.panama_indicator)
          ? `Eligible: code "${data.panama_indicator}"`
          : "Not Eligible",
        adValRate: data.panama_ad_val_rate,
        specificRate: 0,
        otherRate: 0,
        eligible: isEligible(data.panama_indicator)
      },
      // Nepal Preference Program
      {
        label: "Nepal Preference Program",
        status: "Not Eligible",
        adValRate: 0,
        specificRate: 0,
        otherRate: 0,
        eligible: false
      }
    ];

    // Filter to only show eligible programs for the compact view
    const eligiblePrograms = allTradePrograms.filter(program => program.eligible);

    return [
      // Customs Value Section
      {
        id: "customs-value",
        title: "Customs value of recent U.S. imports for consumption",
        fields: [
          {
            label: "2025 imports (thousand dollars)",
            value: "$21"
          }
        ]
      },

      // Tariff Treatment Section
      {
        id: "tariff-treatment",
        title: "Tariff Treatment",
        fields: []
      },

      // Effective Dates Section
      {
        id: "effective-dates",
        title: "Effective Dates",
        fields: [
          {
            label: "Beginning Effective Date",
            subtitle: "Most recent date any part of this HTS item's tariff treatment changed",
            value: formatDate(data.begin_effect_date) || "Not specified"
          },
          {
            label: "Ending Effective Date",
            subtitle: "Date any part of this HTS item is next scheduled for tariff treatment change",
            value: formatDate(data.end_effective_date) || "Not specified"
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
            value: "KG"
          },
          {
            label: "2nd Unit of Quantity (Q2)",
            value: ""
          }
        ]
      },

      // MFN Rates Section
      {
        id: "mfn-rates",
        title: "2024 Normal Trade Relations (NTR) duty rate",
        subtitle: "Formerly known as the Most Favored Nation (MFN) duty rate",
        fields: [
          {
            label: "MFN Text Rate",
            value: data.mfn_text_rate || "None"
          },
          {
            label: "Duty calculation",
            value: "Ad Valorem rate*Value"
          },
          {
            label: "Ad Valorem (percent of value) component",
            value: formatRateValue(data.mfn_ad_val_rate)
          },
          {
            label: "Other duty component",
            value: formatRateValue(data.mfn_other_rate || 0)
          },
          {
            label: "Specific (per unit) component",
            value: formatRateValue(data.mfn_specific_rate || 0)
          }
        ]
      },

      // Column 2 Rates Section
      {
        id: "col2-rates",
        title: "\"Column 2\" (non-NTR) duty rate",
        subtitle: "Applies to imports from a small number of countries that do not enjoy NTR duty status",
        fields: [
          {
            label: "COL2 Text Rate",
            value: data.col2_text_rate || "None"
          },
          {
            label: "Duty calculation",
            value: "Ad Valorem rate*Value"
          },
          {
            label: "Ad Valorem (percent of value) component",
            value: formatRateValue(data.col2_ad_val_rate)
          },
          {
            label: "Other duty component",
            value: formatRateValue(data.col2_other_rate || 0)
          },
          {
            label: "Specific (per unit) component",
            value: formatRateValue(data.col2_specific_rate || 0)
          }
        ]
      },

      // Special Programs Section - Compact View
      {
        id: "special-programs",
        title: "Preferential (duty-free or reduced rate) tariff program applicability to this HTS item",
        subtitle: "",
        fields: allTradePrograms.map(program => ({
          label: program.label,
          status: program.status,
          value: program.eligible
            ? `${formatRateValue(program.adValRate)}`
            : "Not Eligible",
          eligible: program.eligible
        }))
      },

      // Basic Information Section
      {
        id: "basic-info",
        title: "Basic Information",
        fields: [
          {
            label: "HS Code",
            value: data.hts8 ? data.hts8.toString() : "N/A"
          },
          {
            label: "Description",
            value: data.brief_description || "No description available"
          }
        ]
      },

      // Additional Information Section
      {
        id: "additional-info",
        title: "Additional Information",
        fields: data.footnote_comment ? [
          {
            label: "Footnote",
            value: data.footnote_comment
          }
        ] : []
      },

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
  };

  useEffect(() => {
    const fetchTariffInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate HS code format before making the API call
        if (!hsCode || hsCode.trim() === "") {
          setError("Please provide a valid HS code");
          return;
        }
        
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
  }, [hsCode]);

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

  // Get organized tariff sections for display
  const tariffSections = getTariffSections(tariffData);

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

        {/* Basic Information */}
        {tariffSections[8]?.fields.length > 0 && (
          <div className="space-y-3">
            <div>
              <h4 className="text-base font-medium border-b pb-2">{tariffSections[8]?.title}</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {tariffSections[8]?.fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                  <div className="text-sm p-3 rounded-md bg-muted/30">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customs Value */}
        {tariffSections[0]?.fields.length > 0 && (
          <div className="space-y-3">
            <div>
              <h4 className="text-base font-medium border-b pb-2">{tariffSections[0]?.title}</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {tariffSections[0]?.fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                  <div className="text-sm p-3 rounded-md bg-primary/10 text-primary font-medium">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tariff Treatment */}
        {tariffSections[1]?.title && (
          <div className="space-y-3">
            <div>
              <h4 className="text-base font-medium border-b pb-2">{tariffSections[1]?.title}</h4>
            </div>
          </div>
        )}

        {/* Effective Dates */}
        <div className="space-y-3">
          <h4 className="text-base font-medium border-b pb-2">{tariffSections[2]?.title}</h4>
          <div className="grid grid-cols-1 gap-3">
            {tariffSections[2]?.fields.map((field, index) => (
              <div key={index} className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                {field.subtitle && (
                  <p className="text-xs text-muted-foreground mb-1">{field.subtitle}</p>
                )}
                <div className="text-sm bg-muted/30 p-3 rounded-md">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Units of Quantity */}
        {tariffSections[3]?.fields.length > 0 && (
          <div className="space-y-3">
            <div>
              <h4 className="text-base font-medium border-b pb-2">{tariffSections[3]?.title}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tariffSections[3]?.fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                  <div className="text-sm p-3 rounded-md bg-muted/30">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MFN Rates */}
        <div className="space-y-3">
          <div>
            <h4 className="text-base font-medium border-b pb-2">{tariffSections[4]?.title}</h4>
            {tariffSections[4]?.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{tariffSections[4].subtitle}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {tariffSections[4]?.fields.map((field, index) => (
              <div key={index} className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                <div className={cn(
                  "text-sm p-3 rounded-md break-words",
                  field.value !== "None" && field.label === "MFN Text Rate"
                    ? "bg-primary/10 text-primary font-medium"
                    : "bg-muted/30"
                )}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>

          {/* Special Rate Text */}
          {tariffData.col1_special_text && (
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

        {/* Column 2 Rates */}
        <div className="space-y-3">
          <div>
            <h4 className="text-base font-medium border-b pb-2">{tariffSections[5]?.title}</h4>
            {tariffSections[5]?.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{tariffSections[5].subtitle}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {tariffSections[5]?.fields.map((field, index) => (
              <div key={index} className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                <div className={cn(
                  "text-sm p-3 rounded-md break-words",
                  field.value !== "None" && field.label === "COL2 Text Rate"
                    ? "bg-destructive/10 text-destructive font-medium"
                    : "bg-muted/30"
                )}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Programs */}
        {tariffSections[6]?.fields.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">{tariffSections[6]?.title}</h4>
            {tariffSections[6]?.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{tariffSections[6].subtitle}</p>
            )}
            <div className="space-y-4">
              {tariffSections[6]?.fields.map((field, index) => (
                <div key={index} className={cn(
                  "border rounded-md overflow-hidden",
                  field.eligible
                    ? "border-green-200"
                    : "border-muted"
                )}>
                  <div className={cn(
                    "px-3 py-2 border-b",
                    field.eligible
                      ? "bg-green-50 border-green-200"
                      : "bg-muted/30 border-muted"
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

                    {field.eligible && field.value !== "None" && (
                      <div>
                        <span className="font-medium">Ad Valorem Rate:</span>{" "}
                        <span className="text-green-700">{field.value}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {tariffSections[9]?.fields.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">{tariffSections[9]?.title}</h4>
            <div className="grid grid-cols-1 gap-3">
              {tariffSections[9]?.fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                  <p className="text-sm bg-muted/30 p-3 rounded-md">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If there's a footnote_comment but it wasn't included in additionalInfo */}
        {tariffData.footnote_comment && !tariffSections[9]?.fields.some(f => f.label === "Footnote") && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">Footnotes</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <p className="text-sm bg-muted/30 p-3 rounded-md">{tariffData.footnote_comment}</p>
              </div>
            </div>
          </div>
        )}

        {/* External Resources */}
        <div className="space-y-3">
          <h4 className="text-base font-medium border-b pb-2">{tariffSections[10]?.title}</h4>
          {tariffSections[10]?.content}
        </div>

        {/* Footnote References */}
        {Object.keys(footnoteReferences).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">Referenced HS Codes</h4>
            <div className="space-y-4">
              {Object.entries(footnoteReferences).map(([code, reference]) => (
                <div key={code} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-3 py-2 border-b border-border flex justify-between items-center">
                    <h5 className="font-medium text-sm">{code}</h5>
                    {reference.loading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    {reference.loading ? (
                      <div className="text-xs text-muted-foreground">Loading reference...</div>
                    ) : reference.error ? (
                      <div className="text-xs text-destructive">
                        {reference.error}
                      </div>
                    ) : (
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