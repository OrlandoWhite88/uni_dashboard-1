import React, { useState } from "react";
import CustomButton from "./ui/CustomButton";
import { CheckCircle, Copy, DownloadCloud, RefreshCw, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HSCodeResultProps {
  hsCode: string;
  description: string;
  confidence: number;
  fullPath?: string; // Added fullPath prop
  onReset: () => void;
}

const HSCodeResult = ({ hsCode, description, confidence, fullPath, onReset }: HSCodeResultProps) => {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `HS Code: ${hsCode}\nDescription: ${description}\nConfidence: ${confidence}%${fullPath ? `\nClassification Path: ${fullPath}` : ''}`;
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
            <p className="max-w-lg">{description}</p>
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
              onClick={handleDownload} 
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              <DownloadCloud size={16} className="mr-2" />
              Download
            </CustomButton>
            
            <CustomButton 
              onClick={() => setShowExplanation(!showExplanation)} 
              variant={showExplanation ? "default" : "outline"}
              className="flex-1 min-w-[120px]"
            >
              <HelpCircle size={16} className="mr-2" />
              Explain
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
              <div className="text-sm space-y-3">
                <p>
                  <strong>What is HS Code {hsCode}?</strong> The Harmonized System (HS) is an international nomenclature for the classification of products. It allows participating countries to classify traded goods on a common basis for customs purposes.
                </p>
                
                {/* Always show a classification path notice if not available */}
                {fullPath ? (
                  <div className="p-2 bg-primary/5 rounded-md">
                    <strong>Classification Path:</strong> {fullPath}
                  </div>
                ) : (
                  <div className="p-2 bg-amber-500/10 rounded-md">
                    <strong>Classification Path:</strong> Path information not available for this classification. 
                    The system has determined this classification based on your product description.
                  </div>
                )}
                
                <p>
                  <strong>Classification Details:</strong> This code is part of Chapter {hsCode.substring(0, 2)} which covers {getChapterDescription(hsCode.substring(0, 2))}. 
                </p>
                
                <p>
                  The specific subheading {hsCode} applies to your product: <span className="text-primary font-medium">{description}</span>
                </p>
                
                <p>
                  <strong>Import Requirements:</strong> Products under this classification may be subject to specific import duties, taxes, and regulatory requirements which vary by country. We recommend checking with your local customs authority for detailed information.
                </p>
              </div>
            </div>
          )}
          
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
