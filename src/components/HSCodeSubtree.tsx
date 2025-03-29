import React, { useState, useEffect } from "react";
import { getHSCodeSubtree } from "@/lib/classifierService";
import { Loader2, AlertCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import CustomButton from "./ui/CustomButton";
import { cn } from "@/lib/utils";

interface HSCodeSubtreeProps {
  hsCode: string;
}

const HSCodeSubtree: React.FC<HSCodeSubtreeProps> = ({ hsCode }) => {
  const [subtreeData, setSubtreeData] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [prefix, setPrefix] = useState<string>("");
  
  // Format HS code to ensure it has dots at the right positions
  const formatHsCode = (code: string): string => {
    // Remove any non-digit characters
    const digitsOnly = code.replace(/[^\d]/g, '');

    // If empty, return empty string
    if (digitsOnly.length === 0) {
      return '';
    }

    // Format based on length
    if (digitsOnly.length <= 4) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4)}`;
    } else if (digitsOnly.length <= 8) {
      return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4, 6)}.${digitsOnly.slice(6, 8)}`;
    } else if (digitsOnly.length <= 10) {
      return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4, 6)}.${digitsOnly.slice(6, 8)}.${digitsOnly.slice(8, 10)}`;
    } else {
      // Handle any length up to 10 digits
      return `${digitsOnly.slice(0, 4)}.${digitsOnly.slice(4, 6)}.${digitsOnly.slice(6, 8)}.${digitsOnly.slice(8, 10)}`;
    }
  };
  
  // Get the prefix (first 4 digits) of the HS code for subtree lookup
  useEffect(() => {
    if (hsCode) {
      // Format the first 4 digits of the hsCode
      const formattedPrefix = formatHsCode(hsCode.substring(0, 4));
      setPrefix(formattedPrefix);
    }
  }, [hsCode]);

  useEffect(() => {
    const fetchSubtree = async () => {
      if (!prefix) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getHSCodeSubtree(prefix, true);
        setSubtreeData(data);
      } catch (err) {
        setError(`Error fetching HS code subtree: ${err.message}`);
        console.error("Subtree fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (expanded) {
      fetchSubtree();
    }
  }, [prefix, expanded]);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove any non-digit characters for validation
    const digitsOnly = value.replace(/[^\d]/g, '');

    // Only allow up to 8 digits
    if (digitsOnly.length <= 8) {
      // Format with dots
      const formattedCode = formatHsCode(digitsOnly);
      setPrefix(formattedCode);

      // Set cursor position after the last digit
      const input = e.target as HTMLInputElement;
      const cursorPos = input.selectionStart || 0;

      // Schedule the cursor position update after React's re-render
      setTimeout(() => {
        // Calculate new cursor position based on dots added
        const dotsBefore = (value.substring(0, cursorPos).match(/\./g) || []).length;
        const dotsAfter = (formattedCode.substring(0, cursorPos).match(/\./g) || []).length;
        const newPos = cursorPos + (dotsAfter - dotsBefore);

        input.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const handleSearch = () => {
    // Force refetch when the search button is clicked
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const data = await getHSCodeSubtree(prefix, true);
        setSubtreeData(data);
      } catch (err) {
        setError(`Error fetching HS code subtree: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <div 
        className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-medium">HS Code Validation</h3>
        <button className="p-1 rounded-full hover:bg-muted">
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={prefix}
                onChange={handlePrefixChange}
                placeholder="Enter HS code prefix (2-8 digits)"
                className="w-full p-2 pr-10 border border-input rounded-md text-sm"
                maxLength={11} // 8 digits + 3 dots max
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                {prefix.replace(/[^\d]/g, '').length}/8
              </div>
            </div>
            <CustomButton 
              onClick={handleSearch}
              className="flex items-center"
              disabled={!prefix || prefix.length < 2}
              size="sm"
            >
              <Search className="h-4 w-4 mr-1" /> Search
            </CustomButton>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading HS code hierarchy...</span>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Unable to load HS code data</h4>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 p-4 rounded-lg overflow-auto max-h-[500px]">
              <div 
                className="text-xs whitespace-pre-wrap font-mono"
                dangerouslySetInnerHTML={{ __html: highlightClassifiedCode(subtreeData, hsCode) }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
  // Function to highlight the classified HS code in the subtree text
  function highlightClassifiedCode(text: string, code: string): string {
    if (!text || !code) return text;
    
    try {
      // Format the code for comparison - only use up to the first 10 digits
      const digitsOnly = code.replace(/[^\d]/g, '').substring(0, 10);
      
      // Create different prefix matches - 4, 6, 8 and 10 digit versions
      const prefixes = [
        digitsOnly.substring(0, 4),
        digitsOnly.length >= 6 ? `${digitsOnly.substring(0, 4)}.${digitsOnly.substring(4, 6)}` : null,
        digitsOnly.length >= 8 ? `${digitsOnly.substring(0, 4)}.${digitsOnly.substring(4, 6)}.${digitsOnly.substring(6, 8)}` : null,
        digitsOnly.length >= 10 ? `${digitsOnly.substring(0, 4)}.${digitsOnly.substring(4, 6)}.${digitsOnly.substring(6, 8)}.${digitsOnly.substring(8, 10)}` : null
      ].filter(Boolean); // Filter out null values
      
      // Create a copy of the text for processing
      let processedText = text;
      
      // Apply highlights for the most specific match first (longest code)
      // and then work backwards to the least specific match
      for (let i = prefixes.length - 1; i >= 0; i--) {
        const prefix = prefixes[i];
        
        // Escape special regex characters in the code
        const escapedCode = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create a pattern that matches the code at the beginning of a line or after whitespace
        // Make sure we're matching complete codes, not partial segments
        let codePattern;
        
        if (i === prefixes.length - 1) {
          // For the full code (most specific match), use a brighter highlight color
          codePattern = `(^|\\n)(\\s*)(${escapedCode}(\\s|-|\\[|\\]|$)[^\\n]*)`;
          const regex = new RegExp(codePattern, 'g');
          processedText = processedText.replace(
            regex, 
            '$1$2<span style="background-color: #fde68a; color: #92400e; padding: 0 2px; border-radius: 2px; font-weight: bold;">$3</span>'
          );
        } else {
          // For shorter prefixes, use a more subtle highlight
          // but only if they are exact code matches (end with space, dash, etc.)
          codePattern = `(^|\\n)(\\s*)(${escapedCode}(\\s|-|\\[|\\]|$)[^\\n]*)`;
          const regex = new RegExp(codePattern, 'g');
          processedText = processedText.replace(
            regex, 
            '$1$2<span style="background-color: #fef3c7; color: #92400e; padding: 0 2px; border-radius: 2px;">$3</span>'
          );
        }
      }
      
      return processedText;
    } catch (err) {
      console.error("Error highlighting code:", err);
      return text;
    }
  }
};

export default HSCodeSubtree;
