import React, { useState, useEffect, useCallback } from "react";
import { getTariffInfo, explainTariff } from "@/lib/classifierService";
import { Loader2, AlertCircle, ExternalLink, BookOpen, LightbulbIcon, Calculator } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";

interface TariffInfoProps {
  hsCode: string;
  className?: string;
}

interface FootnoteReference {
  id: string;
  text: string;
}

const TariffInfo: React.FC<TariffInfoProps> = ({ hsCode, className }) => {
  const [tariffData, setTariffData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [footnoteReferences, setFootnoteReferences] = useState<Record<string, FootnoteReference>>({});
  const navigate = useNavigate();

  // Format duty rate as percentage
  const formatRate = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "N/A";
    return `${(rate * 100).toFixed(2)}%`;
  };

  useEffect(() => {
    const fetchTariffData = async () => {
      if (!hsCode) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getTariffInfo(hsCode);
        setTariffData(data);

        // Process footnote references if they exist
        if (data.footnotes) {
          const footnoteRefs: Record<string, FootnoteReference> = {};
          data.footnotes.forEach((footnote: any) => {
            if (footnote.footnote_id && footnote.footnote_text) {
              footnoteRefs[footnote.footnote_id] = {
                id: footnote.footnote_id,
                text: footnote.footnote_text
              };
            }
          });
          setFootnoteReferences(footnoteRefs);
        }
      } catch (err: any) {
        setError(`Error fetching tariff information: ${err.message}`);
        console.error("Tariff fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTariffData();
  }, [hsCode]);

  const fetchTariffExplanation = useCallback(async () => {
    // If we already have an explanation, toggle it off
    if (explanation) {
      setExplanation(null);
      return;
    }

    if (!tariffData) return;

    try {
      setLoadingExplanation(true);
      setExplanationError(null);

      const result = await explainTariff(hsCode, tariffData);
      setExplanation(result.explanation);
    } catch (err: any) {
      setExplanationError(`Failed to generate explanation: ${err.message}`);
      console.error("Explanation error:", err);
    } finally {
      setLoadingExplanation(false);
    }
  }, [explanation, hsCode, tariffData]);

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

  // Format duty rate as percentage
  const formatRate = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "N/A";
    return `${(rate * 100).toFixed(2)}%`;
  };

  // Define tariff sections for display
  const tariffSections = tariffData ? [
    {
      id: "description",
      title: "Description",
      content: (
        <p className="text-sm bg-muted/30 p-3 rounded-md">
          {tariffData.brief_description || "No description available"}
        </p>
      )
    },
    {
      id: "rates",
      title: "Duty Rates",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-xs font-medium mb-1">General Duty Rate (MFN)</h5>
            <p className="text-sm bg-muted/30 p-3 rounded-md">
              {formatRate(tariffData.mfn_ad_val_rate)}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-medium mb-1">USMCA Rate (Canada/Mexico)</h5>
            <p className="text-sm bg-muted/30 p-3 rounded-md">
              {tariffData.usmca_indicator ? formatRate(tariffData.usmca_ad_val_rate) : "Not applicable"}
            </p>
          </div>

          {tariffData.korea_indicator && (
            <div>
              <h5 className="text-xs font-medium mb-1">Korea FTA Rate</h5>
              <p className="text-sm bg-muted/30 p-3 rounded-md">
                {formatRate(tariffData.korea_ad_val_rate)}
              </p>
            </div>
          )}

          <div>
            <h5 className="text-xs font-medium mb-1">Column 1 Rate</h5>
            <p className="text-sm bg-muted/30 p-3 rounded-md">
              {formatRate(tariffData.column_1_rate)}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-medium mb-1">Column 2 Rate</h5>
            <p className="text-sm bg-muted/30 p-3 rounded-md">
              {formatRate(tariffData.column_2_rate)}
            </p>
          </div>
        </div>
      )
    },
    {
      id: "special",
      title: "Special Program Indicators",
      content: (
        <p className="text-sm bg-muted/30 p-3 rounded-md">
          {tariffData.special_program_indicators || "None"}
        </p>
      )
    },
    {
      id: "links",
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
  ] : [];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center">
        <h3 className="font-medium">Tariff Information for {tariffData?.hts8}</h3>
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
        {/* Display explanation if available */}
        {explanation && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start">
              <LightbulbIcon className="h-5 w-5 text-blue-500 shrink-0 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-700">Tariff Explanation</h4>
                <div className="text-sm mt-1 text-blue-900 whitespace-pre-wrap">
                  {explanation}
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

        {/* Display tariff data sections */}
        {!error && tariffData && tariffSections.map((section) => (
          <div key={section.id} className="space-y-3">
            <h4 className="font-medium text-sm">{section.title}</h4>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TariffInfo;