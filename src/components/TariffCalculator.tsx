// At the top of src/components/TariffCalculator.tsx
import React, { useState, useEffect } from "react";
import { getTariffInfo } from "@/lib/classifierService";
import { Loader2, AlertCircle, DollarSign, Package, Truck, FileText, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomButton from "./ui/CustomButton";


interface TariffCalculatorProps {
  initialHsCode?: string;
}

interface ShipmentDetails {
  hsCode: string;
  description: string;
  value: string | number;
  quantity: string | number;
  weight: string | number;
  countryOfOrigin: string;
  destinationCountry: string;
  transportMode: string;
  bondType: string;
  insuranceValue: string | number;
  freightCost: string | number;
}

interface CalculationResult {
  dutyAmount: number;
  mpfAmount: number;
  hmfAmount: number;
  bondFee: number;
  insuranceFee: number;
  totalEstimate: number;
  effectiveDutyRate: number;
  breakdown: {
    label: string;
    value: number;
    description: string;
  }[];
}

const TariffCalculator: React.FC<TariffCalculatorProps> = ({ initialHsCode = "" }) => {
  const [hsCode, setHsCode] = useState(initialHsCode);
  const [tariffData, setTariffData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(initialHsCode ? 2 : 1);

  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails>({
    hsCode: initialHsCode,
    description: "",
    value: "",
    quantity: "1",
    weight: "",
    countryOfOrigin: "",
    destinationCountry: "US",
    transportMode: "ocean",
    bondType: "single-entry",
    insuranceValue: "",
    freightCost: "",
  });

  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  // Fetch tariff data when HS code changes
  useEffect(() => {
    if (hsCode && hsCode.length >= 6) {
      fetchTariffData(hsCode);
    }
  }, [hsCode]);

  const fetchTariffData = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching tariff data for HS code:", code);
      const data = await getTariffInfo(code);
      console.log("Received tariff data:", data);
      
      // Validate the tariff data
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid tariff data received");
      }
      
      // Check for required fields
      if (data.hts8 === undefined) {
        console.warn("Missing hts8 field in tariff data");
      }
      
      // Log duty rates for debugging
      console.log("MFN ad valorem rate:", data.mfn_ad_val_rate);
      console.log("USMCA indicator:", data.usmca_indicator);
      console.log("USMCA ad valorem rate:", data.usmca_ad_val_rate);
      
      setTariffData(data);

      // Update shipment details with HS code description if available
      if (data?.brief_description) {
        setShipmentDetails(prev => ({
          ...prev,
          description: data.brief_description || prev.description,
          hsCode: code
        }));
      }

      setLoading(false);
    } catch (err: any) {
      setError(`Failed to fetch tariff information: ${err.message}`);
      setLoading(false);
      console.error("Error fetching tariff data:", err);
    }
  };

  // Handle input changes for shipment details
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (["value", "quantity", "weight", "insuranceValue", "freightCost"].includes(name)) {
      // For numeric fields, store the raw value without leading zeros
      // Only convert to number when needed for calculations
      const numericValue = value === "" ? "" : String(parseFloat(value) || 0);
      setShipmentDetails(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setShipmentDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Calculate duty and fees
  const calculateTariff = () => {
    const productValue = parseFloat(shipmentDetails.value as string) || 0;
    const productQuantity = parseFloat(shipmentDetails.quantity as string) || 1;
    const productWeight = parseFloat(shipmentDetails.weight as string) || 0;

    if (!tariffData || !productValue) {
      setError("Missing required information. Please ensure you've entered an HS code and product value.");
      return;
    }

    console.log("Tariff data received:", tariffData);
    console.log("Product value:", productValue);
    console.log("Product quantity:", productQuantity);
    console.log("Product weight:", productWeight);

    // Determine the duty calculation method based on the tariff data
    const dutyCalculationMethod = tariffData.mfn_rate_type_code || 
                                 (tariffData.mfn_specific_rate ? "specific" : 
                                  tariffData.mfn_ad_val_rate ? "ad_valorem" : "unknown");
    
    console.log("Duty calculation method:", dutyCalculationMethod);
    console.log("MFN text rate:", tariffData.mfn_text_rate);
    console.log("MFN specific rate:", tariffData.mfn_specific_rate);
    console.log("MFN ad valorem rate:", tariffData.mfn_ad_val_rate);

    // Initialize duty amount
    let dutyAmount = 0;
    let dutyRateDescription = "0%";
    let dutyRate = 0;
    
    const origin = shipmentDetails.countryOfOrigin.toUpperCase();
    console.log("Country of origin:", origin);

    // Check if this product is eligible for duty-free treatment under an FTA
    let isFtaEligible = false;
    let ftaName = "";

    // Check USMCA (US-Mexico-Canada Agreement)
    if ((origin === "CA" || origin === "CANADA" || origin === "MX" || origin === "MEXICO") && 
        tariffData.usmca_indicator) {
      isFtaEligible = true;
      ftaName = "USMCA";
    } 
    // Check Korea FTA
    else if ((origin === "KR" || origin === "KOREA") && tariffData.korea_indicator) {
      isFtaEligible = true;
      ftaName = "Korea FTA";
    }
    // Check Australia FTA
    else if ((origin === "AU" || origin === "AUSTRALIA") && tariffData.australia_indicator) {
      isFtaEligible = true;
      ftaName = "Australia FTA";
    }
    // Check Singapore FTA
    else if ((origin === "SG" || origin === "SINGAPORE") && tariffData.singapore_indicator) {
      isFtaEligible = true;
      ftaName = "Singapore FTA";
    }
    // Check Chile FTA
    else if ((origin === "CL" || origin === "CHILE") && tariffData.chile_indicator) {
      isFtaEligible = true;
      ftaName = "Chile FTA";
    }
    // Check other FTAs similarly...

    console.log("FTA eligible:", isFtaEligible, ftaName);

    // If eligible for FTA, duty is zero
    if (isFtaEligible) {
      dutyAmount = 0;
      dutyRateDescription = `0% (${ftaName})`;
    } 
    // Otherwise, calculate based on the duty type
    else {
      // Handle specific rate duties (e.g., cents per liter)
      if (dutyCalculationMethod === "specific" || tariffData.mfn_specific_rate) {
        // Get the specific rate (e.g., $0.0026 per liter)
        const specificRate = typeof tariffData.mfn_specific_rate === 'number' && !isNaN(tariffData.mfn_specific_rate)
          ? tariffData.mfn_specific_rate
          : 0;
        
        // Extract rate from text if available (e.g., "0.26 cents/liter")
        let rateFromText = 0;
        let unit = "unit";
        
        if (tariffData.mfn_text_rate) {
          const rateText = tariffData.mfn_text_rate.toString();
          console.log("Parsing rate from text:", rateText);
          
          // Extract numeric value and unit
          const centsPerUnitMatch = rateText.match(/(\d+\.?\d*)\s*cents?\/(liter|kg|piece|dozen|m2|m3|pair)/i);
          const dollarsPerUnitMatch = rateText.match(/\$(\d+\.?\d*)\/(liter|kg|piece|dozen|m2|m3|pair)/i);
          
          if (centsPerUnitMatch) {
            rateFromText = parseFloat(centsPerUnitMatch[1]) / 100; // Convert cents to dollars
            unit = centsPerUnitMatch[2].toLowerCase();
            console.log(`Extracted ${rateFromText} per ${unit} from text`);
          } else if (dollarsPerUnitMatch) {
            rateFromText = parseFloat(dollarsPerUnitMatch[1]);
            unit = dollarsPerUnitMatch[2].toLowerCase();
            console.log(`Extracted ${rateFromText} per ${unit} from text`);
          }
        }
        
        // Use the extracted rate if available, otherwise use the specific rate from the data
        const effectiveSpecificRate = rateFromText > 0 ? rateFromText : specificRate;
        console.log("Effective specific rate:", effectiveSpecificRate, "per", unit);
        
        // Calculate duty based on quantity or weight depending on the unit
        if (unit.includes("liter") || unit.includes("l")) {
          // Use quantity for liter-based duties
          dutyAmount = effectiveSpecificRate * productQuantity;
          dutyRateDescription = `${(effectiveSpecificRate * 100).toFixed(2)}¢ per liter`;
        } else if (unit.includes("kg")) {
          // Use weight for kg-based duties
          dutyAmount = effectiveSpecificRate * (productWeight || productQuantity);
          dutyRateDescription = `${(effectiveSpecificRate * 100).toFixed(2)}¢ per kg`;
        } else {
          // Default to quantity for other units
          dutyAmount = effectiveSpecificRate * productQuantity;
          dutyRateDescription = `${(effectiveSpecificRate * 100).toFixed(2)}¢ per unit`;
        }
      } 
      // Handle ad valorem duties (percentage of value)
      else {
        // Get the ad valorem rate
        dutyRate = typeof tariffData.mfn_ad_val_rate === 'number' && !isNaN(tariffData.mfn_ad_val_rate) 
          ? tariffData.mfn_ad_val_rate 
          : 0;
        
        // Convert percentage to decimal if needed (e.g., if API returns 5.0 instead of 0.05)
        if (dutyRate > 1) {
          dutyRate = dutyRate / 100;
        }
        
        // Calculate duty amount
        dutyAmount = productValue * dutyRate;
        dutyRateDescription = `${(dutyRate * 100).toFixed(2)}% of declared value`;
      }
    }
    
    console.log("Calculated duty amount:", dutyAmount);

    // Calculate Merchandise Processing Fee (MPF)
    // 2025 rates: 0.3464% with min $32.71 and max $634.62
    let mpfAmount = productValue * 0.003464;
    mpfAmount = Math.max(32.71, Math.min(mpfAmount, 634.62));
    console.log("Calculated MPF amount:", mpfAmount);

    // Calculate Harbor Maintenance Fee (HMF) - only for ocean shipments
    const hmfAmount = shipmentDetails.transportMode === "ocean" ? productValue * 0.00125 : 0;
    console.log("Calculated HMF amount:", hmfAmount);

    // Calculate bond fee - simplified calculation
    let bondFee = 0;
    if (shipmentDetails.bondType === "single-entry") {
      bondFee = Math.max(100, (dutyAmount + mpfAmount + hmfAmount) * 0.01);
    } else if (shipmentDetails.bondType === "continuous") {
      bondFee = 50;
    }
    console.log("Calculated bond fee:", bondFee);

    // Calculate insurance fee if provided
    const insuranceFee = parseFloat(shipmentDetails.insuranceValue as string) || 0;
    console.log("Insurance fee:", insuranceFee);
    
    const freightCost = parseFloat(shipmentDetails.freightCost as string) || 0;
    console.log("Freight cost:", freightCost);

    // Calculate total estimate - ensure all values are valid numbers
    const totalEstimate = 
      (isNaN(dutyAmount) ? 0 : dutyAmount) + 
      (isNaN(mpfAmount) ? 0 : mpfAmount) + 
      (isNaN(hmfAmount) ? 0 : hmfAmount) + 
      (isNaN(bondFee) ? 0 : bondFee) + 
      (isNaN(insuranceFee) ? 0 : insuranceFee) + 
      (isNaN(freightCost) ? 0 : freightCost);
    
    console.log("Total estimate:", totalEstimate);

    // Calculate effective duty rate
    const effectiveDutyRate = productValue > 0 ? (totalEstimate / productValue) : 0;

    // Create breakdown for detailed view
    const breakdown = [
      {
        label: "Customs Duty",
        value: dutyAmount,
        description: dutyRateDescription + (origin ? ` (${origin})` : '')
      },
      {
        label: "Merchandise Processing Fee (MPF)",
        value: mpfAmount,
        description: "0.3464% of value (min $32.71, max $634.62)"
      },
      {
        label: "Harbor Maintenance Fee (HMF)",
        value: hmfAmount,
        description: shipmentDetails.transportMode === "ocean" ? "0.125% of value" : "Not applicable for air/land shipments"
      },
      {
        label: "Customs Bond Fee",
        value: bondFee,
        description: shipmentDetails.bondType === "single-entry" ?
          "Single entry bond fee (min $100 or 1% of duties & fees)" : 
          "Portion of continuous bond fee (based on shipment value)"
      },
      {
        label: "Insurance",
        value: insuranceFee,
        description: "Insurance costs for shipment"
      },
      {
        label: "Freight Cost",
        value: parseFloat(shipmentDetails.freightCost as string) || 0,
        description: "Cost of transportation"
      }
    ];

    setCalculationResult({
      dutyAmount,
      mpfAmount,
      hmfAmount,
      bondFee,
      insuranceFee,
      totalEstimate,
      effectiveDutyRate,
      breakdown
    });

    setStep(4);
  };

  // Format currency values
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  // Format percentage values
  const formatPercentage = (value: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  // Render step 1: HS Code input
  const renderHSCodeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Enter HS Code</h2>
        <p className="text-muted-foreground">
          Start by entering the Harmonized System (HS) code for your product
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="hsCode" className="text-sm font-medium">
            HS Code
          </label>
          <input
            id="hsCode"
            type="text"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            placeholder="Enter 6-10 digit HS code"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <CustomButton
            onClick={() => {
              if (hsCode && hsCode.length >= 6) {
                setStep(2);
              } else {
                setError("Please enter a valid HS code (at least 6 digits)");
              }
            }}
            disabled={loading || !hsCode || hsCode.length < 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Continue"
            )}
          </CustomButton>
        </div>
      </div>
    </div>
  );

  // Render step 2: Product details
  const renderProductDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Product</h2>
        <p className="text-muted-foreground">
          Enter details about your product
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            Product Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            value={shipmentDetails.description}
            onChange={handleInputChange}
            placeholder="Enter product description"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="value" className="text-sm font-medium">
              Declared Value (USD)
            </label>
            <input
              id="value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              value={shipmentDetails.value}
              onChange={handleInputChange}
              placeholder="Enter value in USD"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="quantity" className="text-sm font-medium flex items-center">
              Quantity
              {tariffData?.mfn_specific_rate || (tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('cents')) ? (
                <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                  Required for this HS code
                </span>
              ) : null}
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={shipmentDetails.quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity (e.g., number of liters, kg, pieces)"
              className={cn(
                "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                tariffData?.mfn_specific_rate || (tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('cents')) 
                  ? "border-yellow-300 bg-yellow-50" 
                  : "border-input"
              )}
            />
            {tariffData?.mfn_specific_rate || (tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('cents')) ? (
              <p className="text-xs text-yellow-600 mt-1">
                This HS code has a specific rate duty ({tariffData.mfn_text_rate}). Quantity is required for accurate calculation.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="weight" className="text-sm font-medium flex items-center">
            Weight (kg)
            {tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('kg') ? (
              <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                Required for this HS code
              </span>
            ) : null}
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            min="0"
            step="0.01"
            value={shipmentDetails.weight}
            onChange={handleInputChange}
            placeholder="Enter weight in kg"
            className={cn(
              "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('kg')
                ? "border-yellow-300 bg-yellow-50" 
                : "border-input"
            )}
          />
          {tariffData?.mfn_text_rate && tariffData.mfn_text_rate.toString().includes('kg') ? (
            <p className="text-xs text-yellow-600 mt-1">
              This HS code has a weight-based duty ({tariffData.mfn_text_rate}). Weight is required for accurate calculation.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="countryOfOrigin" className="text-sm font-medium">
            Country of Origin
          </label>
          <select
            id="countryOfOrigin"
            name="countryOfOrigin"
            value={shipmentDetails.countryOfOrigin}
            onChange={handleInputChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a country</option>
            <optgroup label="USMCA Countries">
              <option value="CA">Canada (CA)</option>
              <option value="MX">Mexico (MX)</option>
            </optgroup>
            <optgroup label="Free Trade Agreement Partners">
              <option value="AU">Australia (AU)</option>
              <option value="BH">Bahrain (BH)</option>
              <option value="CL">Chile (CL)</option>
              <option value="CO">Colombia (CO)</option>
              <option value="CR">Costa Rica (CR)</option>
              <option value="DO">Dominican Republic (DO)</option>
              <option value="SV">El Salvador (SV)</option>
              <option value="GT">Guatemala (GT)</option>
              <option value="HN">Honduras (HN)</option>
              <option value="IL">Israel (IL)</option>
              <option value="JO">Jordan (JO)</option>
              <option value="KR">Korea (KR)</option>
              <option value="MA">Morocco (MA)</option>
              <option value="NI">Nicaragua (NI)</option>
              <option value="OM">Oman (OM)</option>
              <option value="PA">Panama (PA)</option>
              <option value="PE">Peru (PE)</option>
              <option value="SG">Singapore (SG)</option>
            </optgroup>
            <optgroup label="Other Major Trading Partners">
              <option value="CN">China (CN)</option>
              <option value="JP">Japan (JP)</option>
              <option value="DE">Germany (DE)</option>
              <option value="UK">United Kingdom (UK)</option>
              <option value="FR">France (FR)</option>
              <option value="IT">Italy (IT)</option>
              <option value="BR">Brazil (BR)</option>
              <option value="IN">India (IN)</option>
              <option value="VN">Vietnam (VN)</option>
              <option value="TW">Taiwan (TW)</option>
            </optgroup>
            <option value="JP">Japan (JP)</option>
            <option value="VN">Vietnam (VN)</option>
            <option value="IN">India (IN)</option>
            <option value="DE">Germany (DE)</option>
            <option value="UK">United Kingdom (UK)</option>
            <option value="FR">France (FR)</option>
            <option value="IT">Italy (IT)</option>
            <option value="BR">Brazil (BR)</option>
            <option value="AU">Australia (AU)</option>
            <option value="ID">Indonesia (ID)</option>
            <option value="TH">Thailand (TH)</option>
            <option value="MY">Malaysia (MY)</option>
            <option value="SG">Singapore (SG)</option>
            <option value="PH">Philippines (PH)</option>
            <option value="TW">Taiwan (TW)</option>
          </select>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <CustomButton variant="outline" onClick={() => setStep(1)}>
            Back
          </CustomButton>
          <CustomButton
            onClick={() => {
              if (!shipmentDetails.value) {
                setError("Please enter a declared value");
              } else {
                setError(null);
                setStep(3);
              }
            }}
          >
            Continue
          </CustomButton>
        </div>
      </div>
    </div>
  );

  // Render step 3: Shipping and bond information
  const renderShippingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Shipping & Bond Information</h2>
        <p className="text-muted-foreground">
          Enter details about shipping and customs bond
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="transportMode" className="text-sm font-medium">
            Transport Mode
          </label>
          <select
            id="transportMode"
            name="transportMode"
            value={shipmentDetails.transportMode}
            onChange={handleInputChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ocean">Ocean</option>
            <option value="air">Air</option>
            <option value="land">Land</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="bondType" className="text-sm font-medium">
            Customs Bond Type
          </label>
          <select
            id="bondType"
            name="bondType"
            value={shipmentDetails.bondType}
            onChange={handleInputChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="single-entry">Single Entry Bond</option>
            <option value="continuous">Continuous Bond</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="freightCost" className="text-sm font-medium">
              Freight Cost (USD)
            </label>
            <input
              id="freightCost"
              name="freightCost"
              type="number"
              min="0"
              step="0.01"
              value={shipmentDetails.freightCost}
              onChange={handleInputChange}
              placeholder="Enter freight cost"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="insuranceValue" className="text-sm font-medium">
              Insurance Value (USD)
            </label>
            <input
              id="insuranceValue"
              name="insuranceValue"
              type="number"
              min="0"
              step="0.01"
              value={shipmentDetails.insuranceValue}
              onChange={handleInputChange}
              placeholder="Enter insurance value"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <CustomButton variant="outline" onClick={() => setStep(2)}>
            Back
          </CustomButton>
          <CustomButton onClick={calculateTariff}>
            Calculate Duties & Fees
          </CustomButton>
        </div>
      </div>
    </div>
  );

  // Render step 4: Results
  const renderResultsStep = () => {
    if (!calculationResult) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Your Estimate</h2>
          <p className="text-muted-foreground">
            Estimated duties and fees for your shipment
          </p>
        </div>

        <div className="bg-primary/10 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Total Estimated Cost</h3>
          <p className="text-3xl font-bold">{formatCurrency(calculationResult.totalEstimate)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Effective Rate: {formatPercentage(calculationResult.effectiveDutyRate)} of declared value
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Breakdown</h3>
          <div className="space-y-3">
            {calculationResult.breakdown.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr,auto] gap-2 pb-2 border-b border-border/40">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <p className="font-medium text-right">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-secondary/50 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Important Notes
          </h3>
          <ul className="text-sm space-y-1 list-disc pl-5">
            <li>This is an estimate only and actual duties and fees may vary.</li>
            <li>Additional fees may apply based on specific product requirements.</li>
            <li>Some products may require additional permits or licenses.</li>
            <li>Consult with a customs broker for professional advice.</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <CustomButton variant="outline" onClick={() => setStep(3)}>
            Back
          </CustomButton>
          <CustomButton onClick={() => {
            // Reset the calculator
            setStep(1);
            setHsCode("");
            setTariffData(null);
            setCalculationResult(null);
            setShipmentDetails({
              hsCode: "",
              description: "",
              value: 0,
              quantity: 1,
              weight: 0,
              countryOfOrigin: "",
              destinationCountry: "US",
              transportMode: "ocean",
              bondType: "single-entry",
              insuranceValue: 0,
              freightCost: 0,
            });
          }}>
            Start New Calculation
          </CustomButton>
        </div>
      </div>
    );
  };

  // Render progress steps
  const renderProgressSteps = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                step >= stepNumber
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {stepNumber}
            </div>
            {stepNumber < 4 && (
              <div
                className={cn(
                  "w-12 h-1 transition-colors",
                  step > stepNumber ? "bg-primary" : "bg-secondary"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Tariff Calculator</h1>
          <p className="text-muted-foreground mt-2">
            Estimate duties, taxes, and fees for your international shipments
          </p>
        </div>

        {renderProgressSteps()}

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          {step === 1 && renderHSCodeStep()}
          {step === 2 && renderProductDetailsStep()}
          {step === 3 && renderShippingStep()}
          {step === 4 && renderResultsStep()}
        </div>
      </div>
    </div>
  );
};

export default TariffCalculator;
