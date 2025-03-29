import React, { useState, useEffect } from "react";
import { getTariffInfo, explainTariff } from "@/lib/classifierService";
import { Loader2, AlertCircle, ExternalLink, BookOpen, LightbulbIcon, Calculator } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";

interface TariffInfoProps {
  hsCode: string;
  className?: string;
}

const TariffInfo: React.FC<TariffInfoProps> = ({ hsCode, className }) => {
  const [tariffData, setTariffData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTariffInfo = async () => {
      if (!hsCode) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getTariffInfo(hsCode);
        setTariffData(data);
      } catch (err: any) {
        setError(`Error fetching tariff information: ${err.message}`);
        console.error("Tariff info error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTariffInfo();
  }, [hsCode]);

  const handleExplainClick = async () => {
    if (loadingExplanation || explanation) {
      setShowExplanation(!showExplanation);
      return;
    }
    
    try {
      setLoadingExplanation(true);
      const explanationText = await explainTariff(hsCode);
      setExplanation(explanationText);
      setShowExplanation(true);
    } catch (err: any) {
      console.error("Error fetching explanation:", err);
      setExplanation("Sorry, we couldn't generate an explanation for this tariff code.");
    } finally {
      setLoadingExplanation(false);
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

  // Format duty rate as percentage
  const formatRate = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "N/A";
    return `${(rate * 100).toFixed(2)}%`;
  };

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden", className)}>
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center">
        <h3 className="font-medium">Tariff Information</h3>
        <div className="flex items-center space-x-2">
          <CustomButton
            onClick={() => navigate(`/tariff-calculator?hsCode=${hsCode}`)}
            variant="outline"
            size="sm"
            className="flex items-center text-xs"
          >
            <Calculator size={14} className="mr-1.5" />
            Calculate Duties & Fees
          </CustomButton>
          <CustomButton
            onClick={handleExplainClick}
            variant="outline"
            size="sm"
            className="flex items-center text-xs"
          >
            <LightbulbIcon size={14} className="mr-1.5" />
            {loadingExplanation ? "Loading..." : explanation ? (showExplanation ? "Hide" : "Show") + " Explanation" : "Explain"}
          </CustomButton>
        </div>
      </div>
      
      <div className="p-4">
        {/* Basic tariff information */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm bg-muted/30 p-3 rounded-md">
              {tariffData.brief_description || "No description available"}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">General Duty Rate (MFN)</h4>
              <p className="text-sm bg-muted/30 p-3 rounded-md">
                {formatRate(tariffData.mfn_ad_val_rate)}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">USMCA Rate (Canada/Mexico)</h4>
              <p className="text-sm bg-muted/30 p-3 rounded-md">
                {tariffData.usmca_indicator ? formatRate(tariffData.usmca_ad_val_rate) : "Not applicable"}
              </p>
            </div>
          </div>
          
          {/* Additional trade agreement rates if available */}
          {tariffData.korea_indicator && (
            <div>
              <h4 className="text-sm font-medium mb-2">Korea FTA Rate</h4>
              <p className="text-sm bg-muted/30 p-3 rounded-md">
                {formatRate(tariffData.korea_ad_val_rate)}
              </p>
            </div>
          )}
          
          {/* Special program indicators */}
          <div>
            <h4 className="text-sm font-medium mb-2">Special Program Indicators</h4>
            <p className="text-sm bg-muted/30 p-3 rounded-md">
              {tariffData.special_program_indicators || "None"}
            </p>
          </div>
          
          {/* Column 1 and Column 2 rates if available */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Column 1 Rate</h4>
              <p className="text-sm bg-muted/30 p-3 rounded-md">
                {formatRate(tariffData.column_1_rate)}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Column 2 Rate</h4>
              <p className="text-sm bg-muted/30 p-3 rounded-md">
                {formatRate(tariffData.column_2_rate)}
              </p>
            </div>
          </div>
          
          {/* External links */}
          <div className="pt-2">
            <a 
              href={`https://hts.usitc.gov/?query=${hsCode}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center"
            >
              <ExternalLink size={14} className="mr-1.5" />
              View on USITC Harmonized Tariff Schedule
            </a>
          </div>
        </div>
        
        {/* AI-generated explanation */}
        {showExplanation && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center mb-3">
              <BookOpen size={16} className="mr-2 text-primary" />
              <h4 className="font-medium">Tariff Explanation</h4>
            </div>
            
            {loadingExplanation ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <span className="text-sm">Generating explanation...</span>
              </div>
            ) : (
              <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-line">
                {explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TariffInfo;