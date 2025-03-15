
import React, { useState } from "react";
import CustomButton from "./ui/CustomButton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2 } from "lucide-react";

interface ProductInputProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
}

const ProductInput = ({ onSubmit, isLoading }: ProductInputProps) => {
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
          Generate Harmonized System Codes
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enter your product description below, and our AI will generate the most accurate
          HS code for your product. We may ask follow-up questions to ensure precision.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative glass-card p-1 rounded-lg transition-all duration-300 focus-within:shadow-soft">
          <Textarea
            className="min-h-32 p-4 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 resize-none"
            placeholder="Describe your product in detail... (e.g., 'Women's knitted cotton sweater with embroidered patterns, designed for casual wear')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
          
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
