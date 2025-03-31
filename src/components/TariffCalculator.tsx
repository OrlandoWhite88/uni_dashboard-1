// At the top of src/components/TariffCalculator.tsx
import React, { useState, useEffect } from "react";
import { getTariffInfo } from "@/lib/classifierService";
import { Loader2, AlertCircle, DollarSign, Package, Truck, FileText, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
      const data = await getTariffInfo(code);
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
      setError("Failed to fetch tariff information. Please try again.");
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

    if (!tariffData || !productValue) {
      setError("Missing required information. Please ensure you've entered an HS code and product value.");
      return;
    }

    // Get the appropriate duty rate based on country of origin
    let dutyRate = tariffData.mfn_ad_val_rate || 0;
    const origin = shipmentDetails.countryOfOrigin.toUpperCase();

    // Check for FTA eligibility and apply appropriate rates
    if ((origin === "CA" || origin === "CANADA") && tariffData.usmca_indicator) {
      dutyRate = tariffData.usmca_ad_val_rate || 0;
    } else if ((origin === "MX" || origin === "MEXICO") && tariffData.usmca_indicator) {
      dutyRate = tariffData.usmca_ad_val_rate || 0;
    } else if ((origin === "KR" || origin === "KOREA") && tariffData.korea_indicator) {
      dutyRate = tariffData.korea_ad_val_rate || 0;
    } else if ((origin === "AU" || origin === "AUSTRALIA") && tariffData.australia_indicator) {
      dutyRate = tariffData.australia_ad_val_rate || 0;
    } else if ((origin === "SG" || origin === "SINGAPORE") && tariffData.singapore_indicator) {
      dutyRate = tariffData.singapore_ad_val_rate || 0;
    } else if ((origin === "CL" || origin === "CHILE") && tariffData.chile_indicator) {
      dutyRate = tariffData.chile_ad_val_rate || 0;
    } else if ((origin === "IL" || origin === "ISRAEL") && tariffData.israel_fta_indicator) {
      dutyRate = tariffData.israel_fta_ad_val_rate || 0;
    } else if ((origin === "JO" || origin === "JORDAN") && tariffData.jordan_indicator) {
      dutyRate = tariffData.jordan_ad_val_rate || 0;
    } else if ((origin === "BH" || origin === "BAHRAIN") && tariffData.bahrain_indicator) {
      dutyRate = tariffData.bahrain_ad_val_rate || 0;
    } else if ((origin === "OM" || origin === "OMAN") && tariffData.oman_indicator) {
      dutyRate = tariffData.oman_ad_val_rate || 0;
    } else if ((origin === "PE" || origin === "PERU") && tariffData.peru_indicator) {
      dutyRate = tariffData.peru_ad_val_rate || 0;
    } else if ((origin === "CO" || origin === "COLOMBIA") && tariffData.columbia_indicator) {
      dutyRate = tariffData.columbia_ad_val_rate || 0;
    } else if ((origin === "PA" || origin === "PANAMA") && tariffData.panama_indicator) {
      dutyRate = tariffData.panama_ad_val_rate || 0;
    } else if (origin && ["GT", "SV", "HN", "NI", "CR", "DO"].includes(origin) && tariffData.dr_cafta_indicator) {
      // DR-CAFTA countries: Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica, Dominican Republic
      dutyRate = tariffData.dr_cafta_ad_val_rate || 0;
    } else if ((origin === "MA" || origin === "MOROCCO") && tariffData.morocco_indicator) {
      dutyRate = tariffData.morocco_ad_val_rate || 0;
    }

    // Ensure duty rate is a valid number
    dutyRate = typeof dutyRate === 'number' && !isNaN(dutyRate) ? dutyRate : 0;

    // Calculate duty amount
    const dutyAmount = productValue * dutyRate;

    // Calculate Merchandise Processing Fee (MPF)
    // 2025 rates: 0.3464% with min $32.71 and max $634.62
    let mpfAmount = productValue * 0.003464;
    mpfAmount = Math.max(32.71, Math.min(mpfAmount, 634.62));

    // Calculate Harbor Maintenance Fee (HMF) - only for ocean shipments
    // Current rate is 0.125% of value
    const hmfAmount = shipmentDetails.transportMode === "ocean" ? productValue * 0.00125 : 0;

    // Calculate bond fee - more accurate calculation
    let bondFee = 0;
    if (shipmentDetails.bondType === "single-entry") {
      // Single entry bond is typically $100 minimum or 1% of duties, taxes, and fees
      const feesForBondCalculation = dutyAmount + mpfAmount + hmfAmount;
      bondFee = Math.max(100, feesForBondCalculation * 0.01);
    } else if (shipmentDetails.bondType === "continuous") {
      // Continuous bond is typically $50,000 per year, but we'll allocate a portion
      // based on the shipment value relative to expected annual imports
      // Assuming $1M in annual imports, this shipment's portion would be:
      const annualImportEstimate = 1000000; // $1M
      bondFee = Math.min(50, (productValue / annualImportEstimate) * 500);
    }

    // Calculate insurance fee if provided
    const insuranceFee = parseFloat(shipmentDetails.insuranceValue as string) || 0;
    const freightCost = parseFloat(shipmentDetails.freightCost as string) || 0;

    // Calculate total estimate
    const totalEstimate = dutyAmount + mpfAmount + hmfAmount + bondFee + insuranceFee + freightCost;

    // Calculate effective duty rate
    const effectiveDutyRate = productValue > 0 ? (totalEstimate / productValue) : 0;

    // Create breakdown for detailed view
    const breakdown = [
      {
        label: "Customs Duty",
        value: dutyAmount,
        description: `${(dutyRate * 100).toFixed(2)}% of declared value${origin ? ` (${origin})` : ''}`
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
        value: shipmentDetails.freightCost,
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

  // Navigate to the main classification page
  const navigate = useNavigate();

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

        {/* Don't have an HS code? Classify here button */}
        <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-sm">Don't have an HS code?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Use our AI-powered classifier to find the right HS code for your product
              </p>
            </div>
            <CustomButton
              variant="secondary"
              onClick={() => navigate('/')}
              className="whitespace-nowrap text-sm"
              size="sm"
            >
              Classify Here
            </CustomButton>
          </div>
        </div>

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
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={shipmentDetails.quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="weight" className="text-sm font-medium">
            Weight (kg)
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
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
            <option value="CA">Canada (CA)</option>
            <option value="MX">Mexico (MX)</option>
            <option value="KR">Korea (KR)</option>
            <option value="CN">China (CN)</option>
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
