"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HSCodeResult from "@/components/HSCodeResult";
import { AlertCircle, ArrowLeft } from "lucide-react";
import CustomButton from "@/components/ui/CustomButton";

interface ClassificationResult {
  hsCode: string;
  description: string;
  confidence: number;
  fullPath?: string;
  originalProduct: string;
  classificationDecisions?: any[];
  timestamp: string;
}

const ClassificationCompletePage = () => {
  const router = useRouter();
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retrieve classification result from sessionStorage
    const storedResult = sessionStorage.getItem('classificationResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        setResult(parsedResult);
      } catch (error) {
        console.error('Error parsing classification result:', error);
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleReset = () => {
    // Clear the stored result and go back to product page
    sessionStorage.removeItem('classificationResult');
    router.push('/product');
  };

  const handleRestartClassification = async (productDescription: string, forcedPath: Array<{ code: string; description: string }>) => {
    // Store the forced path in sessionStorage for the classify page to pick up
    sessionStorage.setItem('forcedPath', JSON.stringify(forcedPath));
    sessionStorage.setItem('productToClassify', productDescription);
    
    // Navigate to classify page with URL params
    const params = new URLSearchParams({
      description: productDescription,
      model: 'groq' // Default model, could be stored with the result if needed
    });
    router.push(`/classify?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="glass-card p-8 rounded-xl flex items-center justify-center">
          <div className="animate-pulse">Loading classification result...</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium mb-2">No Classification Result Found</h3>
              <p className="text-muted-foreground mb-4">
                It looks like there's no classification result to display. This might happen if you've refreshed the page or accessed this URL directly.
              </p>
              <div className="flex gap-3">
                <CustomButton 
                  onClick={() => router.push('/product')} 
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Product
                </CustomButton>
                <CustomButton 
                  variant="outline"
                  onClick={() => router.push('/classification-history')}
                >
                  View History
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <HSCodeResult
        hsCode={result.hsCode}
        description={result.description}
        confidence={result.confidence}
        fullPath={result.fullPath}
        originalProduct={result.originalProduct}
        classificationDecisions={result.classificationDecisions || []}
        onReset={handleReset}
        onRestartClassification={handleRestartClassification}
      />
    </div>
  );
};

export default ClassificationCompletePage;
