import React, { useState, useEffect } from "react";
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

// Define types based on the API response
interface Footnote {
  columns: string[];
  marker: string;
  value: string;
  type: string;
}

interface TariffData {
  hts_code: string;
  description: string;
  general_rate: string;
  special_rate: string;
  other_rate: string;
  footnotes: Footnote[];
  units: any[];
  node_type: string;
  is_superior: boolean;
}

const TariffInfo: React.FC<TariffInfoProps> = ({ hsCode }) => {
  const [tariffData, setTariffData] = useState<TariffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [footnoteReferences, setFootnoteReferences] = useState<Record<string, FootnoteReference>>({});
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTariffInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTariffInfo(hsCode);
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
    return match ? match[1] : null;
  };

  // Function to fetch footnote reference information
  const fetchFootnoteReference = async (footnoteValue: string) => {
    const hsCode = extractHsCode(footnoteValue);
    
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

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center">
        <h3 className="font-medium">Tariff Information for {tariffData.hts_code}</h3>
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

      <div className="p-4 space-y-4">
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
        {/* Description */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
          <p className="text-sm bg-muted/30 p-3 rounded-md">{tariffData.description}</p>
        </div>

        {/* Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">General Rate</h4>
            <div className={cn(
              "text-sm p-3 rounded-md font-medium break-words",
              tariffData.general_rate ? "bg-primary/10 text-primary" : "bg-muted/30"
            )}>
              {tariffData.general_rate || "None"}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">Special Rate</h4>
            <div className={cn(
              "text-sm p-3 rounded-md break-words",
              tariffData.special_rate ? "bg-primary/10 text-primary font-medium" : "bg-muted/30"
            )}>
              {tariffData.special_rate || "None"}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">Other Rate</h4>
            <div className={cn(
              "text-sm p-3 rounded-md break-words",
              tariffData.other_rate ? "bg-primary/10 text-primary font-medium" : "bg-muted/30"
            )}>
              {tariffData.other_rate || "None"}
            </div>
          </div>
        </div>

        {/* Footnotes */}
        {tariffData.footnotes && tariffData.footnotes.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">Footnotes</h4>
            <div className="bg-muted/30 p-3 rounded-md">
              <ul className="space-y-3 text-sm">
                {tariffData.footnotes.map((footnote, index) => {
                  // Check if footnote contains a reference to another HS code
                  const referencedCode = extractHsCode(footnote.value);
                  const hasReference = !!referencedCode;
                  
                  return (
                    <li key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-primary font-medium shrink-0">{footnote.marker}</span>
                        <span className="break-words">{footnote.value}</span>
                      </div>
                      
                      {hasReference && (
                        <div className="ml-5 mt-1">
                          <CustomButton 
                            onClick={() => fetchFootnoteReference(footnote.value)}
                            variant="outline"
                            size="sm"
                            className="flex items-center text-xs"
                          >
                            <ExternalLink size={12} className="mr-1" />
                            {footnoteReferences[referencedCode!] ? "Hide" : "Show"} Referenced Code
                          </CustomButton>
                          
                          {/* Display referenced code info when expanded */}
                          {referencedCode && footnoteReferences[referencedCode] && (
                            <div className="mt-2 p-3 border border-border bg-background/50 rounded-md">
                              {footnoteReferences[referencedCode].loading ? (
                                <div className="flex items-center justify-center py-2">
                                  <Loader2 size={14} className="animate-spin mr-2" />
                                  <span className="text-xs">Loading reference...</span>
                                </div>
                              ) : footnoteReferences[referencedCode].error ? (
                                <div className="text-xs text-destructive">
                                  {footnoteReferences[referencedCode].error}
                                </div>
                              ) : (
                                <div className="space-y-2 text-xs">
                                  <div className="font-medium">
                                    {referencedCode} - Referenced Information
                                  </div>
                                  <div>
                                    <span className="font-medium">Description:</span>{" "}
                                    {footnoteReferences[referencedCode].data.description}
                                  </div>
                                  {footnoteReferences[referencedCode].data.general_rate && (
                                    <div>
                                      <span className="font-medium">General Rate:</span>{" "}
                                      {footnoteReferences[referencedCode].data.general_rate}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TariffInfo;
