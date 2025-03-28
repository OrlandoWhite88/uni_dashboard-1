import React, { useState, useEffect, useCallback } from "react";
import { getTariffInfo, explainTariff } from "@/lib/classifierService";
import { Loader2, AlertCircle, ExternalLink, BookOpen, LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomButton from "./ui/CustomButton";

interface TariffInfoProps {
  hsCode: string;
}

interface FootnoteReference {
  code: string;
  data: any;
  loading: boolean;
  error: string | null;
}

// Define types based on the new API response
interface TariffData {
  // Required fields
  hts8: string;
  brief_description?: string;
  requested_hts_code: string;
  matched_hts_code: string;

  // Quantity and units
  quantity_1_code?: string;
  quantity_2_code?: string;

  // WTO binding
  wto_binding_code?: string;

  // MFN (Most Favored Nation) rates
  mfn_text_rate?: string;
  mfn_rate_type_code?: string;
  mfn_ave?: number;
  mfn_ad_val_rate?: number;
  mfn_specific_rate?: string | number;
  mfn_other_rate?: string | number;

  // Special rates and indicators
  col1_special_text?: string;
  col1_special_mod?: string;

  // GSP (Generalized System of Preferences)
  gsp_indicator?: string;
  gsp_ctry_excluded?: string;

  // Other indicators
  apta_indicator?: string;
  civil_air_indicator?: string;

  // NAFTA/USMCA related
  nafta_canada_ind?: string;
  nafta_mexico_ind?: string;
  mexico_rate_type_code?: string;
  mexico_ad_val_rate?: number;
  mexico_specific_rate?: number;

  // CBI (Caribbean Basin Initiative)
  cbi_indicator?: string;
  cbi_ad_val_rate?: number;
  cbi_specific_rate?: number;

  // AGOA (African Growth and Opportunity Act)
  agoa_indicator?: string;

  // CBTPA (Caribbean Basin Trade Partnership Act)
  cbtpa_indicator?: string;
  cbtpa_rate_type_code?: string;
  cbtpa_ad_val_rate?: number;
  cbtpa_specific_rate?: number;

  // Various FTA (Free Trade Agreement) indicators and rates
  israel_fta_indicator?: string;
  atpa_indicator?: string;
  atpa_ad_val_rate?: number;
  atpa_specific_rate?: number;
  atpdea_indicator?: string;

  // Jordan FTA
  jordan_indicator?: string;
  jordan_rate_type_code?: number | string;
  jordan_ad_val_rate?: number;
  jordan_specific_rate?: number;
  jordan_other_rate?: number;

  // Singapore FTA
  singapore_indicator?: string;
  singapore_rate_type_code?: number | string;
  singapore_ad_val_rate?: number;
  singapore_specific_rate?: number;
  singapore_other_rate?: number;

  // Chile FTA
  chile_indicator?: string;
  chile_rate_type_code?: number | string;
  chile_ad_val_rate?: number;
  chile_specific_rate?: number;
  chile_other_rate?: number;

  // Morocco FTA
  morocco_indicator?: string;
  morocco_rate_type_code?: number | string;
  morocco_ad_val_rate?: number;
  morocco_specific_rate?: number;
  morocco_other_rate?: number;

  // Australia FTA
  australia_indicator?: string;
  australia_rate_type_code?: number | string;
  australia_ad_val_rate?: number;
  australia_specific_rate?: number;
  australia_other_rate?: number;

  // Bahrain FTA
  bahrain_indicator?: string;
  bahrain_rate_type_code?: string;
  bahrain_ad_val_rate?: number;
  bahrain_specific_rate?: number;
  bahrain_other_rate?: number;

  // DR-CAFTA
  dr_cafta_indicator?: string;
  dr_cafta_rate_type_code?: string;
  dr_cafta_ad_val_rate?: number;
  dr_cafta_specific_rate?: number;
  dr_cafta_other_rate?: number;

  // DR-CAFTA Plus
  dr_cafta_plus_indicator?: string;
  dr_cafta_plus_rate_type_code?: string;
  dr_cafta_plus_ad_val_rate?: number;
  dr_cafta_plus_specific_rate?: number;
  dr_cafta_plus_other_rate?: number;

  // Oman FTA
  oman_indicator?: string;
  oman_rate_type_code?: number | string;
  oman_ad_val_rate?: number;
  oman_specific_rate?: number;
  oman_other_rate?: number;

  // Peru FTA
  peru_indicator?: string;
  peru_rate_type_code?: number | string;
  peru_ad_val_rate?: number;
  peru_specific_rate?: number;
  peru_other_rate?: number;

  // Special indicators
  pharmaceutical_ind?: string;
  dyes_indicator?: string;

  // Column 2 rates (non-NTR)
  col2_text_rate?: string;
  col2_rate_type_code?: string;
  col2_ad_val_rate?: number;
  col2_specific_rate?: number;
  col2_other_rate?: number;

  // Effective dates
  begin_effect_date?: string;
  end_effective_date?: string;

  // Additional information
  footnote_comment?: string;
  additional_duty?: string;

  // Korea FTA
  korea_indicator?: string;
  korea_rate_type_code?: number | string;
  korea_ad_val_rate?: number;
  korea_specific_rate?: number;
  korea_other_rate?: number;

  // Colombia FTA
  columbia_indicator?: string;
  columbia_rate_type_code?: number | string;
  columbia_ad_val_rate?: number;
  columbia_specific_rate?: number;
  columbia_other_rate?: number;

  // Panama FTA
  panama_indicator?: string;
  panama_rate_type_code?: string;
  panama_ad_val_rate?: number;
  panama_specific_rate?: number;
  panama_other_rate?: number;

  // Other indicators
  nepal_indicator?: string;

  // Japan FTA
  japan_indicator?: string;
  japan_rate_type_code?: string;
  japan_ad_val_rate?: number;
  japan_specific_rate?: number;
  japan_other_rate?: number;

  // USMCA (United States-Mexico-Canada Agreement)
  usmca_indicator?: string;
  usmca_rate_type_code?: number | string;
  usmca_ad_val_rate?: number;
  usmca_specific_rate?: number;
  usmca_other_rate?: number;
}

// Helper function to format rate values
const formatRateValue = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return "None";
  if (typeof value === "number") {
    // Format as percentage if it's a decimal less than 1
    if (value < 1 && value > 0) return `${(value * 100).toFixed(1)}%`;
    // Format as dollar amount if it's a specific rate
    return `$${value.toFixed(2)}`;
  }
  return value.toString();
};

// Helper function to determine if a country/program is eligible based on indicator
const isEligible = (indicator?: string): boolean => {
  return !!indicator && indicator.trim() !== "";
};

// Helper function to get eligibility status text
const getEligibilityStatus = (indicator?: string): string => {
  if (!indicator) return "Not Eligible";
  return `Eligible: code "${indicator}"`;
};

// Helper function to format date strings
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";

  // Check if the date is in ISO format (YYYY-MM-DD)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  return dateStr;
};

const TariffInfo: React.FC<TariffInfoProps> = ({ hsCode }) => {
  const [tariffData, setTariffData] = useState<TariffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [footnoteReferences, setFootnoteReferences] = useState<Record<string, FootnoteReference>>({});
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  // Group tariff data into logical sections for display
  const getTariffSections = useCallback(() => {
    if (!tariffData) return {};

    return {
      // Basic information
      basicInfo: {
        title: "Basic Information",
        fields: [
          { label: "HTS Code", value: tariffData.hts8 },
          { label: "Description", value: tariffData.brief_description || "No description available" },
          { label: "Requested HTS Code", value: tariffData.requested_hts_code },
          { label: "Matched HTS Code", value: tariffData.matched_hts_code }
        ]
      },

      // Quantity and units
      quantityInfo: {
        title: "Quantity and Units",
        fields: [
          { label: "1st Unit of Quantity (Q1)", value: tariffData.quantity_1_code || "None" },
          { label: "2nd Unit of Quantity (Q2)", value: tariffData.quantity_2_code || "None" }
        ]
      },

      // Effective dates
      effectiveDates: {
        title: "Effective Dates",
        fields: [
          {
            label: "Beginning Effective Date",
            value: formatDate(tariffData.begin_effect_date) || "Not specified"
          },
          {
            label: "Ending Effective Date",
            value: formatDate(tariffData.end_effective_date) || "Not specified"
          }
        ]
      },

      // MFN rates
      mfnRates: {
        title: "2024 Normal Trade Relations (NTR) Duty Rate",
        subtitle: "Formerly known as the Most Favored Nation (MFN) duty rate",
        fields: [
          { label: "MFN Text Rate", value: tariffData.mfn_text_rate || "None" },
          { label: "Duty Calculation", value: tariffData.mfn_ad_val_rate ? "Ad Valorem rate*Value" : "None" },
          { label: "Ad Valorem (percent of value) Component", value: formatRateValue(tariffData.mfn_ad_val_rate) },
          { label: "Specific (per unit) Component", value: formatRateValue(tariffData.mfn_specific_rate) },
          { label: "Other Duty Component", value: formatRateValue(tariffData.mfn_other_rate) }
        ]
      },

      // Column 2 rates
      column2Rates: {
        title: "\"Column 2\" (non-NTR) Duty Rate",
        subtitle: "Applies to imports from a small number of countries that do not enjoy NTR duty status",
        fields: [
          { label: "COL2 Text Rate", value: tariffData.col2_text_rate || "None" },
          { label: "Duty Calculation", value: tariffData.col2_ad_val_rate ? "Ad Valorem rate*Value" : "None" },
          { label: "Ad Valorem (percent of value) Component", value: formatRateValue(tariffData.col2_ad_val_rate) },
          { label: "Specific (per unit) Component", value: formatRateValue(tariffData.col2_specific_rate) },
          { label: "Other Duty Component", value: formatRateValue(tariffData.col2_other_rate) }
        ]
      },

      // Special programs
      specialPrograms: {
        title: "Preferential Tariff Programs",
        subtitle: "Duty-free or reduced rate tariff program applicability",
        programs: [
          // GSP
          {
            name: "GSP (Generalized System of Preferences)",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.gsp_indicator) },
              ...(tariffData.gsp_indicator && tariffData.gsp_ctry_excluded ? [
                { label: "Countries Excluded", value: tariffData.gsp_ctry_excluded }
              ] : [])
            ],
            eligible: isEligible(tariffData.gsp_indicator)
          },

          // Civil Aircraft Agreement
          {
            name: "Civil Aircraft Agreement Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.civil_air_indicator) }
            ],
            eligible: isEligible(tariffData.civil_air_indicator)
          },

          // Pharmaceutical
          {
            name: "Pharmaceutical Products",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.pharmaceutical_ind) }
            ],
            eligible: isEligible(tariffData.pharmaceutical_ind)
          },

          // Dyes
          {
            name: "Tariff Concession on Dyes",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.dyes_indicator) }
            ],
            eligible: isEligible(tariffData.dyes_indicator)
          },

          // CBI
          {
            name: "CBI or CBERA (Caribbean Basin Initiative)",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.cbi_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.cbi_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.cbi_specific_rate) }
            ],
            eligible: isEligible(tariffData.cbi_indicator)
          },

          // AGOA
          {
            name: "AGOA (African Growth and Opportunity Act)",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.agoa_indicator) }
            ],
            eligible: isEligible(tariffData.agoa_indicator)
          },

          // CBTPA
          {
            name: "CBTPA (Caribbean Basin Trade Partnership Act)",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.cbtpa_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.cbtpa_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.cbtpa_specific_rate) }
            ],
            eligible: isEligible(tariffData.cbtpa_indicator)
          },

          // Israel FTA
          {
            name: "Israel FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.israel_fta_indicator) }
            ],
            eligible: isEligible(tariffData.israel_fta_indicator)
          },

          // Jordan FTA
          {
            name: "Jordan FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.jordan_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.jordan_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.jordan_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.jordan_other_rate) }
            ],
            eligible: isEligible(tariffData.jordan_indicator)
          },

          // Singapore FTA
          {
            name: "Singapore FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.singapore_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.singapore_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.singapore_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.singapore_other_rate) }
            ],
            eligible: isEligible(tariffData.singapore_indicator)
          },

          // Chile FTA
          {
            name: "Chile FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.chile_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.chile_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.chile_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.chile_other_rate) }
            ],
            eligible: isEligible(tariffData.chile_indicator)
          },

          // Morocco FTA
          {
            name: "Morocco FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.morocco_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.morocco_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.morocco_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.morocco_other_rate) }
            ],
            eligible: isEligible(tariffData.morocco_indicator)
          },

          // Australia FTA
          {
            name: "Australia FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.australia_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.australia_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.australia_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.australia_other_rate) }
            ],
            eligible: isEligible(tariffData.australia_indicator)
          },

          // Bahrain FTA
          {
            name: "Bahrain FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.bahrain_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.bahrain_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.bahrain_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.bahrain_other_rate) }
            ],
            eligible: isEligible(tariffData.bahrain_indicator)
          },

          // DR-CAFTA
          {
            name: "CAFTA FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.dr_cafta_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.dr_cafta_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.dr_cafta_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.dr_cafta_other_rate) }
            ],
            eligible: isEligible(tariffData.dr_cafta_indicator)
          },

          // DR-CAFTA Plus
          {
            name: "CAFTA PLUS FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.dr_cafta_plus_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.dr_cafta_plus_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.dr_cafta_plus_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.dr_cafta_plus_other_rate) }
            ],
            eligible: isEligible(tariffData.dr_cafta_plus_indicator)
          },

          // Oman FTA
          {
            name: "Oman FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.oman_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.oman_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.oman_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.oman_other_rate) }
            ],
            eligible: isEligible(tariffData.oman_indicator)
          },

          // Peru FTA
          {
            name: "Peru FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.peru_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.peru_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.peru_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.peru_other_rate) }
            ],
            eligible: isEligible(tariffData.peru_indicator)
          },

          // Korea FTA
          {
            name: "Korea FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.korea_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.korea_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.korea_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.korea_other_rate) }
            ],
            eligible: isEligible(tariffData.korea_indicator)
          },

          // Colombia FTA
          {
            name: "Colombia FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.columbia_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.columbia_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.columbia_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.columbia_other_rate) }
            ],
            eligible: isEligible(tariffData.columbia_indicator)
          },

          // Panama FTA
          {
            name: "Panama FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.panama_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.panama_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.panama_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.panama_other_rate) }
            ],
            eligible: isEligible(tariffData.panama_indicator)
          },

          // Nepal
          {
            name: "Nepal Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.nepal_indicator) }
            ],
            eligible: isEligible(tariffData.nepal_indicator)
          },

          // Japan FTA
          {
            name: "Japan FTA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.japan_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.japan_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.japan_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.japan_other_rate) }
            ],
            eligible: isEligible(tariffData.japan_indicator)
          },

          // USMCA
          {
            name: "USMCA Preference",
            fields: [
              { label: "Status", value: getEligibilityStatus(tariffData.usmca_indicator) },
              { label: "Ad Valorem Rate", value: formatRateValue(tariffData.usmca_ad_val_rate) },
              { label: "Specific Rate", value: formatRateValue(tariffData.usmca_specific_rate) },
              { label: "Other Rate", value: formatRateValue(tariffData.usmca_other_rate) }
            ],
            eligible: isEligible(tariffData.usmca_indicator)
          }
        ]
      },

      // Additional information
      additionalInfo: {
        title: "Additional Information",
        fields: [
          ...(tariffData.footnote_comment ? [{ label: "Footnote", value: tariffData.footnote_comment }] : []),
          ...(tariffData.additional_duty ? [{ label: "Additional Duty", value: tariffData.additional_duty }] : []),
          ...(tariffData.col1_special_text ? [{ label: "Special Text", value: tariffData.col1_special_text }] : [])
        ]
      }
    };
  }, [tariffData]);

  useEffect(() => {
    const fetchTariffInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTariffInfo(hsCode);
        console.log("Received tariff data:", data);
        setTariffData(data);
      } catch (err) {
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
      
      const explanationText = await explainTariff(hsCode, true, 'medium');
      setExplanation(explanationText);
    } catch (err) {
      setExplanationError(`Error getting explanation: ${err.message}`);
      console.error("Tariff explanation error:", err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Function to extract HS codes from footnote text
  const extractHsCode = (text: string): string | null => {
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
  const fetchFootnoteReference = async (footnoteText: string) => {
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
    } catch (err) {
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
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Loading tariff information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-destructive">Unable to load tariff information</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tariffData) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <p className="text-center text-muted-foreground">No tariff information available</p>
      </div>
    );
  }

  // Get the organized tariff sections
  const tariffSections = getTariffSections();

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center">
        <h3 className="font-medium">Tariff Information for {tariffData.hts8}</h3>
        <CustomButton
          onClick={fetchTariffExplanation}
          variant={explanation ? "default" : "outline"}
          size="sm"
          className="flex items-center text-xs bg-blue-500 hover:bg-blue-600 text-white"
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
                  {explanation.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {explanationError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mr-2 mt-0.5" />
              <p className="text-sm text-destructive">{explanationError}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-3">
          <h4 className="text-base font-medium border-b pb-2">{tariffSections.basicInfo?.title}</h4>
          <div className="grid grid-cols-1 gap-3">
            {tariffSections.basicInfo?.fields.map((field, index) => (
              <div key={index} className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                <p className="text-sm bg-muted/30 p-3 rounded-md">{field.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity and Units */}
        {tariffSections.quantityInfo?.fields.some(f => f.value !== "None") && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">{tariffSections.quantityInfo?.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tariffSections.quantityInfo?.fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                  <div className={cn(
                    "text-sm p-3 rounded-md break-words",
                    field.value !== "None" ? "bg-primary/10 text-primary font-medium" : "bg-muted/30"
                  )}>
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Effective Dates */}
        {tariffSections.effectiveDates?.fields.some(f => f.value !== "Not specified") && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">{tariffSections.effectiveDates?.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tariffSections.effectiveDates?.fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                  <div className={cn(
                    "text-sm p-3 rounded-md break-words",
                    field.value !== "Not specified" ? "bg-primary/10 text-primary font-medium" : "bg-muted/30"
                  )}>
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
            <h4 className="text-base font-medium border-b pb-2">{tariffSections.mfnRates?.title}</h4>
            {tariffSections.mfnRates?.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{tariffSections.mfnRates.subtitle}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {tariffSections.mfnRates?.fields.map((field, index) => (
              <div key={index} className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                <div className={cn(
                  "text-sm p-3 rounded-md break-words",
                  field.value !== "None" ? "bg-primary/10 text-primary font-medium" : "bg-muted/30"
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
            <h4 className="text-base font-medium border-b pb-2">{tariffSections.column2Rates?.title}</h4>
            {tariffSections.column2Rates?.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{tariffSections.column2Rates.subtitle}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {tariffSections.column2Rates?.fields.map((field, index) => (
              <div key={index} className="space-y-1">
                <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                <div className={cn(
                  "text-sm p-3 rounded-md break-words",
                  field.value !== "None" ? "bg-primary/10 text-primary font-medium" : "bg-muted/30"
                )}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Programs */}
        <div className="space-y-3">
          <div>
            <h4 className="text-base font-medium border-b pb-2">{tariffSections.specialPrograms?.title}</h4>
            {tariffSections.specialPrograms?.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{tariffSections.specialPrograms.subtitle}</p>
            )}
          </div>

          <div className="space-y-4">
            {/* Only show eligible programs by default */}
            {tariffSections.specialPrograms?.programs
              .filter(program => program.eligible)
              .map((program, index) => (
                <div key={index} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-3 py-2 border-b border-border">
                    <h5 className="font-medium text-sm">{program.name}</h5>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {program.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">{field.label}:</div>
                          <div className="font-medium">{field.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Additional Information */}
        {tariffSections.additionalInfo?.fields.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">{tariffSections.additionalInfo?.title}</h4>
            <div className="grid grid-cols-1 gap-3">
              {tariffSections.additionalInfo?.fields.map((field, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="text-sm font-medium text-muted-foreground">{field.label}</h5>
                  <p className="text-sm bg-muted/30 p-3 rounded-md">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If there's a footnote_comment but it wasn't included in additionalInfo */}
        {tariffData.footnote_comment && !tariffSections.additionalInfo?.fields.some(f => f.label === "Footnote") && (
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
        {Object.keys(footnoteReferences).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">Referenced HS Codes</h4>
            <div className="space-y-3">
              {Object.entries(footnoteReferences).map(([code, reference]) => (
                <div key={code} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-3 py-2 border-b border-border flex justify-between items-center">
                    <h5 className="font-medium text-sm">{code}</h5>
                    <CustomButton
                      onClick={() => fetchFootnoteReference(`See ${code}`)}
                      variant="outline"
                      size="sm"
                      className="flex items-center text-xs h-6 px-2"
                    >
                      <X size={12} className="mr-1" />
                      Hide
                    </CustomButton>
                  </div>
                  <div className="p-3">
                    {reference.loading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 size={14} className="animate-spin mr-2" />
                        <span className="text-xs">Loading reference...</span>
                      </div>
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
