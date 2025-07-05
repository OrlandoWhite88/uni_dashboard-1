
import React, { useState } from "react";
import CustomButton from "./ui/CustomButton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2 } from "lucide-react";

interface ProductInputProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
  selectedModel: 'vertex' | 'groq';
  onModelChange: (model: 'vertex' | 'groq') => void;
}

const ProductInput = ({ onSubmit, isLoading, selectedModel, onModelChange }: ProductInputProps) => {
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onSubmit(description);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Accurate HS Codes Instantly
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our AI engine classifies your products with precise Harmonized System codes
          for customs clearance, tariffs, and international trade compliance.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative glass-card p-1 rounded-lg transition-all duration-300 focus-within:shadow-soft">
          <Textarea
            className="min-h-32 p-4 pb-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 resize-none"
            placeholder="Describe your product in detail... (e.g., 'Industrial water pump with 1500W motor, stainless steel housing, for agricultural irrigation systems')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
          
          {/* Model selector buttons in bottom-left */}
          <div className="absolute bottom-4 left-4 flex gap-2 z-10">
            <button
              type="button"
              onClick={() => onModelChange('groq')}
              disabled={isLoading}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                selectedModel === 'groq'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Flash
            </button>
            <button
              type="button"
              onClick={() => onModelChange('vertex')}
              disabled={isLoading}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                selectedModel === 'vertex'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Deep
            </button>
          </div>
          
          <div className="absolute bottom-4 right-4">
            <CustomButton
              type="submit"
              disabled={!description.trim() || isLoading}
              className="rounded-full w-10 h-10 p-0 transition-all duration-300 ease-out-back"
              aria-label="Submit product description"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
            </CustomButton>
          </div>
        </div>
        
        <div className="mt-2 text-center text-xs text-muted-foreground">
          Enter as much detail as possible for the most accurate results
        </div>
      </form>
    </div>
  );
};

export default ProductInput;
