import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ProductInput from "@/components/ProductInput";
import CustomButton from "@/components/ui/CustomButton";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { trackClassificationStart } from "@/lib/analyticsService";

const Dashboard = () => {
  const [selectedModel, setSelectedModel] = useState<'vertex' | 'groq'>('groq');
  const router = useRouter();
  const { checkCanMakeRequest } = useUsageLimits();

  const handleClassify = async (description: string) => {
    console.log("[Dashboard] Starting classification for:", description);
    
    // Check if the user can make a request based on their usage limits
    const canMakeRequest = await checkCanMakeRequest();
    if (!canMakeRequest) {
      return; // Don't proceed if the user has reached their limit
    }
    
    // Track the classification start event
    trackClassificationStart(description);
    
    // Navigate to the classify page with the product description and model
    router.push('/classify');
  };

  return (
    <Layout className="pt-32 pb-16">
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
    </Layout>
  );
};

export default Dashboard;
