import React, { useState, useEffect } from "react";
import CustomButton from "./ui/CustomButton";
import { CheckCircle, Copy, Calculator, RefreshCw, Shield, X, AlertTriangle, Loader2, DownloadCloud, Eye, Flag, Building, DollarSign, ExternalLink, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TariffInfo from "./TariffInfo";
import HSCodeSubtree from "./HSCodeSubtree";
import ClassificationDecisionPath, { ClassificationDecision } from "./ClassificationDecisionPath";
import { explainTariff, getTariffInfo, getHSCodeSubtree } from "@/lib/classifierService";
import { saveClassification } from "@/lib/supabaseService";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Trade Flags interfaces (from TradeComplianceFlags component)
interface PGAFlag {
  id: string;
  agency: string;
  agencyCode: string;
  requirement: string;
  severity: 'none' | 'standard' | 'restricted';
  description: string;
  documents?: string[];
  additionalInfo?: string;
  url?: string;
}

interface CVDFlag {
  id: string;
  type: 'ADD' | 'CVD';
  rate: number;
  country: string;
  effectiveDate: string;
  expiryDate?: string;
  caseNumber: string;
  status: 'active' | 'suspended' | 'revoked';
  description: string;
  productScope?: string;
}

interface PGAResponse {
  hs_code_requested: string;
  hs_code_searched: string;
  flags: Record<string, boolean>;
  flagged_pgas: string[];
  total_flagged: number;
  search_timestamp: string;
}

interface CVDResponse {
  hs_code_requested: string;
  hs_code_searched: string;
  duty_type: string;
  flags: Record<string, boolean>;
  flagged_duties: string[];
  total_flagged: number;
  search_timestamp: string;
}

interface HSCodeResultProps {
  hsCode: string;
  description: string;
  confidence: number;
  fullPath?: string; // Added fullPath prop
  originalProduct?: string; // Original product description from user input
  classificationDecisions?: ClassificationDecision[]; // Added classification decisions
  onReset: () => void;
  onRestartClassification?: (productDescription: string, forcedPath: Array<{ code: string; description: string }>) => void;
}

const HSCodeResult = ({ hsCode, description, confidence, fullPath, originalProduct, classificationDecisions, onReset, onRestartClassification }: HSCodeResultProps) => {
  const router = useRouter();
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showTradeFlags, setShowTradeFlags] = useState(false);
  const [pgaData, setPgaData] = useState<PGAResponse | null>(null);
  const [cvdData, setCvdData] = useState<CVDResponse | null>(null);
  const [loadingTradeFlags, setLoadingTradeFlags] = useState(false);
  const [tradeFlagsError, setTradeFlagsError] = useState<string>("");
  
  // State for pre-loading tariff data
  const [preloadedTariffData, setPreloadedTariffData] = useState<any>(null);
  const [tariffLoading, setTariffLoading] = useState(true);
  const [tariffError, setTariffError] = useState<string | null>(null);
  
  // State for saving classification
  const [classificationSaved, setClassificationSaved] = useState(false);
  
  // State for showing immediate children
  const [showChildren, setShowChildren] = useState(false);
  const [childrenData, setChildrenData] = useState<string>("");
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childrenError, setChildrenError] = useState<string>("");

  const handleCopy = () => {
    navigator.clipboard.writeText(hsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `HS Code: ${hsCode}\nDescription: ${description}\nConfidence: ${confidence}%${fullPath ? `\nClassification Path: ${fullPath}` : ''}${originalProduct ? `\nOriginal Product: ${originalProduct}` : ''}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `hs-code-${hsCode}.txt`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Pre-load tariff data when component mounts
  useEffect(() => {
    const fetchTariffData = async () => {
      try {
        setTariffLoading(true);
        setTariffError(null);
        console.log("Pre-loading tariff data for HS code:", hsCode);
        
        const data = await getTariffInfo(hsCode);
        setPreloadedTariffData(data);
        console.log("Tariff data pre-loaded successfully:", data);
      } catch (error) {
        console.error("Error pre-loading tariff data:", error);
        setTariffError(error instanceof Error ? error.message : "Failed to load tariff data");
      } finally {
        setTariffLoading(false);
      }
    };

    if (hsCode) {
      fetchTariffData();
    }
  }, [hsCode]);

  // Save classification to database when component mounts
  useEffect(() => {
    const saveClassificationToDb = async () => {
      if (!userId || !hsCode || classificationSaved) {
        return; // Don't save if user not logged in, no HS code, or already saved
      }

      try {
        console.log("Saving classification to database:", {
          hsCode,
          description: originalProduct || description,
          confidence
        });

        const classificationData = {
          user_id: userId,
          product_description: originalProduct || description,
          hs_code: hsCode,
          confidence: confidence,
          full_path: fullPath,
          tariff_data: preloadedTariffData // Use the preloaded tariff data
        };

        const result = await saveClassification(classificationData);
        
        if (result) {
          console.log("Classification saved successfully:", result);
          setClassificationSaved(true);
        } else {
          console.error("Failed to save classification");
        }
      } catch (error) {
        console.error("Error saving classification:", error);
      }
    };

    // Only save after tariff data is loaded (or failed to load)
    if (!tariffLoading) {
      saveClassificationToDb();
    }
  }, [userId, hsCode, originalProduct, description, confidence, fullPath, preloadedTariffData, tariffLoading, classificationSaved]);

  const handleCalculateTariffs = () => {
    // Navigate to tariff calculator with pre-populated HS code
    router.push(`/tariff-calculator?hsCode=${hsCode}`);
  };

  const handleViewChildren = async () => {
    if (showChildren && childrenData) {
      // If already showing children, just toggle off
      setShowChildren(false);
      return;
    }

    if (!childrenData) {
      // Need to fetch children
      setLoadingChildren(true);
      setChildrenError("");
      
      try {
        // Remove dots from HS code for API call
        const cleanHsCode = hsCode.replace(/\./g, '');
        const children = await getHSCodeSubtree(cleanHsCode, false, 1);
        setChildrenData(children);
        setShowChildren(true);
      } catch (error) {
        console.error("Error fetching children:", error);
        setChildrenError(error instanceof Error ? error.message : "Failed to fetch children");
      } finally {
        setLoadingChildren(false);
      }
    } else {
      // Already have children data, just show it
      setShowChildren(true);
    }
  };

  // Helper function to format HS code for API
  const formatHsCodeForApi = (code: string) => {
    // Remove any non-numeric characters
    const numericCode = code.replace(/[^0-9]/g, '');
    
    // Ensure it's at least 10 digits, pad with zeros if needed
    const paddedCode = numericCode.padEnd(10, '0');
    
    // Format as XX.XX.XX.XX
    return `${paddedCode.slice(0, 4)}.${paddedCode.slice(4, 6)}.${paddedCode.slice(6, 8)}.${paddedCode.slice(8, 10)}`;
  };

  const handleTradeFlags = async () => {
    if (showTradeFlags && (pgaData || cvdData)) {
      // If already showing trade flags, just toggle off
      setShowTradeFlags(false);
      return;
    }

    if (!pgaData && !cvdData) {
      // Need to fetch trade flags
      setLoadingTradeFlags(true);
      setTradeFlagsError("");
      
      try {
        // Format the HS code for API
        const formattedCode = formatHsCodeForApi(hsCode);
        
        // Make parallel API calls using the correct endpoints
        const [pgaResponse, cvdResponse, addResponse] = await Promise.all([
          fetch(`https://data-api-rose.vercel.app/search-pga?hs_code=${formattedCode}`),
          fetch(`https://data-api-rose.vercel.app/search-cvd?hs_code=${formattedCode}`),
          fetch(`https://data-api-rose.vercel.app/search-add?hs_code=${formattedCode}`)
        ]);

        if (!pgaResponse.ok || !cvdResponse.ok || !addResponse.ok) {
          throw new Error('API request failed');
        }

        const [pgaResult, cvdResult, addResult] = await Promise.all([
          pgaResponse.json(),
          cvdResponse.json(),
          addResponse.json()
        ]);

        setPgaData(pgaResult);
        setCvdData(cvdResult);
        setShowTradeFlags(true);
      } catch (error) {
        console.error("Error fetching trade flags:", error);
        setTradeFlagsError(error instanceof Error ? error.message : "Failed to fetch trade flags");
      } finally {
        setLoadingTradeFlags(false);
      }
    } else {
      // Already have trade flags data, just show it
      setShowTradeFlags(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-scale-in">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
          <CheckCircle size={14} className="mr-1" /> Analysis Complete
        </div>
        <h2 className="text-2xl font-semibold mb-2">Your HS Code Result</h2>
      </div>
      
      <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 w-full bg-primary/20">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out-expo" 
            style={{ width: `${confidence}%` }}
          ></div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-5xl font-bold tracking-tight mb-6 text-center">{hsCode}</div>
          
          <div className="text-center mb-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Classification Description</div>
            <p className="max-w-lg">{description !== "Product" ? description : (originalProduct || "Product")}</p>
          </div>

          {/* Classification Decision Path */}
          <div className="mb-6 w-full">
            <ClassificationDecisionPath 
              decisions={classificationDecisions || []} 
              isVisible={classificationDecisions && classificationDecisions.length > 0}
              originalProduct={originalProduct}
              onRestartClassification={onRestartClassification}
            />
          </div>
          
          {/* Confidence section - hidden but keeping code for potential future use
          <div className="bg-secondary rounded-lg px-4 py-2 mb-6">
            <div className="text-sm">
              <span className="font-medium">Confidence:</span>{" "}
              <span className={cn(
                confidence > 85 ? "text-green-600" : 
                confidence > 70 ? "text-amber-600" : 
                "text-red-600"
              )}>
                {confidence}%
              </span>
            </div>
          </div>
          */}
          
          <Tabs defaultValue="result" className="w-full mt-6">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="result">Basic Info</TabsTrigger>
              <TabsTrigger value="tariff">Tariff Data</TabsTrigger>
              <TabsTrigger value="validation">Validate Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="result" className="mt-0">
              <div className="flex flex-wrap gap-3 justify-center w-full">
                <CustomButton 
                  onClick={handleCopy} 
                  variant="outline" 
                  className="flex-1 min-w-[120px]"
                >
                  {copied ? <CheckCircle size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? "Copied" : "Copy Code"}
                </CustomButton>
                
                <CustomButton 
                  onClick={handleCalculateTariffs} 
                  variant="outline"
                  className="flex-1 min-w-[120px]"
                >
                  <Calculator size={16} className="mr-2" />
                  Calculate Tariffs
                </CustomButton>
                
                <CustomButton 
                  onClick={handleTradeFlags} 
                  variant={showTradeFlags ? "default" : "outline"}
                  className="flex-1 min-w-[120px]"
                  disabled={loadingTradeFlags}
                >
                  {loadingTradeFlags ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Shield size={16} className="mr-2" />
                  )}
                  {loadingTradeFlags ? "Checking..." : "Trade Flags"}
                </CustomButton>
              </div>
              
              {/* Trade Flags Panel */}
              {showTradeFlags && (
                <div className="mt-6 p-4 bg-secondary/50 border border-border rounded-lg w-full animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium flex items-center">
                      <Shield size={16} className="mr-2" />
                      Trade Compliance Flags
                    </h3>
                    <button 
                      onClick={() => setShowTradeFlags(false)}
                      className="p-1 rounded-full hover:bg-secondary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  {tradeFlagsError ? (
                    <div className="text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-700">Failed to fetch trade flags</p>
                          <p className="text-red-600 mt-1">{tradeFlagsError}</p>
                        </div>
                      </div>
                    </div>
                  ) : pgaData || cvdData ? (
                    <div className="text-sm space-y-4">
                      {/* PGA Requirements Summary */}
                      {pgaData && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Building size={14} className="mr-2 text-blue-600" />
                              <span className="font-medium">PGA Requirements</span>
                            </div>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              pgaData.total_flagged > 0 
                                ? "bg-amber-100 text-amber-800" 
                                : "bg-green-100 text-green-800"
                            )}>
                              {pgaData.total_flagged > 0 
                                ? `${pgaData.total_flagged} Requirements` 
                                : "No Requirements"}
                            </span>
                          </div>
                          {pgaData.total_flagged > 0 && (
                            <div className="pl-6 text-xs text-muted-foreground">
                              Agencies: {pgaData.flagged_pgas.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CVD/ADD Duties Summary */}
                      {cvdData && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <DollarSign size={14} className="mr-2 text-green-600" />
                              <span className="font-medium">ADD/CVD Duties</span>
                            </div>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              cvdData.total_flagged > 0 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            )}>
                              {cvdData.total_flagged > 0 
                                ? `${cvdData.total_flagged} Active Duties` 
                                : "No Duties"}
                            </span>
                          </div>
                          {cvdData.total_flagged > 0 && (
                            <div className="pl-6 text-xs text-muted-foreground">
                              Type: {cvdData.duty_type} | Countries: {cvdData.flagged_duties.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* View Full Report Link */}
                      <div className="pt-3 border-t border-border/50">
                        <button
                          onClick={() => router.push(`/trade-flags?hsCode=${hsCode.replace(/\./g, '')}`)}
                          className="flex items-center text-primary hover:text-primary/80 text-xs font-medium"
                        >
                          <ExternalLink size={12} className="mr-1" />
                          View Detailed Compliance Report
                        </button>
                      </div>

                      {/* Product Context */}
                      {(originalProduct || fullPath) && (
                        <div className="pt-3 border-t border-border/50 space-y-2">
                          {originalProduct && (
                            <div className="p-2 bg-primary/5 rounded-md">
                              <strong>Your Product:</strong> {originalProduct}
                            </div>
                          )}
                          {fullPath && (
                            <div className="p-2 bg-primary/5 rounded-md">
                              <strong>Classification Path:</strong> {fullPath}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Checking trade compliance...</span>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tariff" className="space-y-4 mt-0">
              {/* Tariff Info Component with pre-loaded data */}
              <TariffInfo 
                hsCode={hsCode} 
                preloadedData={preloadedTariffData}
                isLoading={tariffLoading}
                preloadError={tariffError}
              />
              
              <div className="text-center mt-4">
                <p className="text-xs text-muted-foreground">
                  Tariff data is updated daily for maximum accuracy from official customs sources.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="validation" className="mt-0">
              {/* HS Code Validation/Subtree Component */}
              <HSCodeSubtree hsCode={hsCode} />
              
              <div className="flex items-start mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Verify your classification</p>
                  <p className="mt-1">
                    Review the HS code hierarchy to ensure your product is correctly classified. 
                    You can search for specific code prefixes to explore different sections of the nomenclature.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <button 
            onClick={onReset}
            className="mt-8 flex items-center text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            <RefreshCw size={14} className="mr-1" /> Start Over
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get chapter descriptions
const getChapterDescription = (chapter: string): string => {
  const chapters: Record<string, string> = {
    "01": "Live Animals",
    "02": "Meat and Edible Meat Offal",
    "03": "Fish and Crustaceans",
    "04": "Dairy Produce; Birds' Eggs; Natural Honey",
    "05": "Products of Animal Origin",
    "06": "Live Trees and Other Plants",
    "07": "Edible Vegetables",
    "08": "Edible Fruits and Nuts",
    "09": "Coffee, Tea, and Spices",
    "10": "Cereals",
    "11": "Products of the Milling Industry",
    "12": "Oil Seeds and Oleaginous Fruits",
    "39": "Plastics and Articles Thereof",
    "40": "Rubber and Articles Thereof",
    "61": "Articles of Apparel and Clothing Accessories, Knitted",
    "62": "Articles of Apparel and Clothing Accessories, Not Knitted",
    "63": "Other Made Up Textile Articles",
    "84": "Machinery and Mechanical Appliances",
    "85": "Electrical Machinery and Equipment",
    "90": "Optical, Photographic, Measuring, and Medical Instruments",
    "94": "Furniture; Bedding, Mattresses, Cushions",
    "95": "Toys, Games and Sports Requisites",
  };
  
  return chapters[chapter] || "various products based on international trade classifications";
};

export default HSCodeResult;
