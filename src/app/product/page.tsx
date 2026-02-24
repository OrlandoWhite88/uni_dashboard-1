"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ProductInput from "@/components/ProductInput";
import CustomButton from "@/components/ui/CustomButton";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { trackClassificationStart } from "@/lib/analyticsService";

const ProductPage = () => {
  const [selectedModel, setSelectedModel] = useState<'vertex' | 'groq'>('groq');
  const router = useRouter();
  const { checkFeatureAccess } = useUsageLimits();

  const handleClassify = async (description: string) => {
    console.log("[ProductPage] Starting classification for:", description);
    
    const canMakeRequest = await checkFeatureAccess('classification');
    if (!canMakeRequest) {
      return;
    }
    
    // Track the classification start event
    trackClassificationStart(description);
    
    // Navigate to the classify page with the product description and model as URL params
    const params = new URLSearchParams({
      description: description,
      model: selectedModel
    });
    router.push(`/classify?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Product Input */}
      <ProductInput
        onSubmit={handleClassify}
        isLoading={false}
      />
      
      {/* Batch Processing Option */}
      <div className="mt-4 glass-card p-4 rounded-xl bg-secondary/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium mb-1">Need to classify multiple products?</h3>
            <p className="text-sm text-muted-foreground">
              Use our batch processing feature to classify multiple products at once.
            </p>
          </div>
          <CustomButton 
            variant="outline" 
            onClick={() => router.push('/bulk-import')}
            className="flex items-center whitespace-nowrap ml-4"
            type="button"
          >
            Batch Import <ArrowRight size={14} className="ml-2" />
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
