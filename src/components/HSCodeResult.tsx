import React, { useState, useEffect } from "react";
import CustomButton from "./ui/CustomButton";
import { CheckCircle, Copy, Calculator, RefreshCw, HelpCircle, X, AlertTriangle, Loader2, DownloadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TariffInfo from "./TariffInfo";
import HSCodeSubtree from "./HSCodeSubtree";
import { explainTariff, getTariffInfo } from "@/lib/classifierService";
import { saveClassification } from "@/lib/supabaseService";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

interface HSCodeResultProps {
  hsCode: string;
  description: string;
  confidence: number;
  fullPath?: string; // Added fullPath prop
  originalProduct?: string; // Original product description from user input
  onReset: () => void;
}

const HSCodeResult = ({ hsCode, description, confidence, fullPath, originalProduct, onReset }: HSCodeResultProps) => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string>("");
  
  // State for pre-loading tariff data
  const [preloadedTariffData, setPreloadedTariffData] = useState<any>(null);
  const [tariffLoading, setTariffLoading] = useState(true);
  const [tariffError, setTariffError] = useState<string | null>(null);
  
  // State for saving classification
  const [classificationSaved, setClassificationSaved] = useState(false);

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
    navigate(`/tariff-calculator?hsCode=${hsCode}`);
  };

  const handleExplain = async () => {
    if (showExplanation && explanation) {
      // If already showing explanation, just toggle off
      setShowExplanation(false);
      return;
    }

    if (!explanation) {
      // Need to fetch explanation
      setLoadingExplanation(true);
      setExplanationError("");
      
      try {
        const llmExplanation = await explainTariff(hsCode, true, 'high');
        setExplanation(llmExplanation);
        setShowExplanation(true);
      } catch (error) {
        console.error("Error fetching explanation:", error);
        setExplanationError(error instanceof Error ? error.message : "Failed to generate explanation");
      } finally {
        setLoadingExplanation(false);
      }
    } else {
      // Already have explanation, just show it
      setShowExplanation(true);
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
          <div className="text-5xl font-bold tracking-tight mb-4 text-center">{hsCode}</div>
          
          <div className="text-center mb-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Classification Description</div>
            <p className="max-w-lg">{description !== "Product" ? description : (originalProduct || "Product")}</p>
          </div>
          
          <div className="bg-secondary rounded-lg px-4 py-2 mb-8">
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
          
          <Tabs defaultValue="result" className="w-full mt-4">
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
                  onClick={handleExplain} 
                  variant={showExplanation ? "default" : "outline"}
                  className="flex-1 min-w-[120px]"
                  disabled={loadingExplanation}
                >
                  {loadingExplanation ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <HelpCircle size={16} className="mr-2" />
                  )}
                  {loadingExplanation ? "Generating..." : "Explain"}
                </CustomButton>
              </div>
              
              {/* Explanation Panel */}
              {showExplanation && (
                <div className="mt-6 p-4 bg-secondary/50 border border-border rounded-lg w-full animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">HS Code Explanation</h3>
                    <button 
                      onClick={() => setShowExplanation(false)}
                      className="p-1 rounded-full hover:bg-secondary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  {explanationError ? (
                    <div className="text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-700">Failed to generate explanation</p>
                          <p className="text-red-600 mt-1">{explanationError}</p>
                        </div>
                      </div>
                    </div>
                  ) : explanation ? (
                    <div className="text-sm space-y-3">
                      <div className="whitespace-pre-wrap">{explanation}</div>
                      
                      {/* Show original product and classification path if available */}
                      {(originalProduct || fullPath) && (
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
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
                      <span className="text-sm text-muted-foreground">Generating explanation...</span>
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
