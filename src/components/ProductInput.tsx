
import React, { useState } from "react";
import CustomButton from "./ui/CustomButton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Package, HelpCircle } from "lucide-react";

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
      <div className="mb-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 animate-slide-down">
          HS Code Generator
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Generate Harmonized System Codes
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Enter your product description below, and our AI will generate the most accurate
          HS code for your product. We may ask follow-up questions to ensure precision.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex gap-3 px-4 py-3 rounded-lg bg-secondary/50 text-muted-foreground text-sm">
            <Package size={16} className="shrink-0 mt-0.5" />
            <p>
              For best results, include details about: <span className="font-medium text-foreground">material, composition, purpose, and product features</span>
            </p>
          </div>
        </div>
        
        <div className="relative glass-card p-1.5 rounded-lg transition-all duration-300 focus-within:shadow-soft border border-border/60">
          <Textarea
            className="min-h-40 p-5 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 resize-none text-lg"
            placeholder="Describe your product in detail... (e.g., 'Women's knitted cotton sweater with embroidered patterns, designed for casual wear')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
          
          <div className="absolute bottom-4 right-4">
            <CustomButton
              type="submit"
              disabled={!description.trim() || isLoading}
              className="rounded-full w-12 h-12 p-0 transition-all duration-300 ease-out-back shadow-sm"
              aria-label="Submit product description"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
            </CustomButton>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
          <HelpCircle size={14} className="mr-1.5" />
          <span>Enter as much detail as possible for the most accurate results</span>
        </div>
      </form>
    </div>
  );
};

export default ProductInput;
