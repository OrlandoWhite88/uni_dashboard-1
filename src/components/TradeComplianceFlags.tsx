import React, { useState, useEffect } from "react";
import { getUserClassifications, ClassificationRecord } from "@/lib/supabaseService";
import { useAuth } from "@clerk/clerk-react";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { 
  Loader2, 
  AlertCircle, 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle2, 
  ChevronDown, 
  Search,
  Download,
  Info,
  Flag,
  Building,
  Calendar,
  DollarSign,
  ExternalLink,
  Filter,
  Package,
  Eye,
  Globe,
  Clock,
  BookOpen,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import CustomButton from "./ui/CustomButton";

interface TradeComplianceFlagsProps {
  initialHsCode?: string;
}

// PGA Flag interface
interface PGAFlag {
  id: string;
  agency: string;
  agencyCode: string;
  requirement: string;
  severity: 'none' | 'standard' | 'restricted';
  description: string;
  documents?: string[];
  additionalInfo?: string;
  url?: string;
}

// ADD/CVD Flag interface
interface CVDFlag {
  id: string;
  type: 'ADD' | 'CVD';
  rate: number;
  country: string;
  effectiveDate: string;
  expiryDate?: string;
  caseNumber: string;
  status: 'active' | 'suspended' | 'revoked';
  description: string;
  productScope?: string;
}

// API Response interfaces
interface PGAResponse {
  hs_code_requested: string;
  hs_code_searched: string;
  flags: Record<string, boolean>;
  flagged_pgas: string[];
  total_flagged: number;
  search_timestamp: string;
}

interface CVDResponse {
  hs_code_requested: string;
  hs_code_searched: string;
  duty_type: string;
  flags: Record<string, boolean>;
  flagged_duties: string[];
  total_flagged: number;
  search_timestamp: string;
}

// Trade Program Code mapping
const TRADE_PROGRAM_MAPPING: Record<string, Omit<PGAFlag, 'id'>> = {
  // Lacey Act
  AL1: {
    agency: "U.S. Fish and Wildlife Service",
    agencyCode: "USFWS",
    requirement: "Lacey Act Declaration May Be Required",
    severity: "standard",
    description: "Lacey Act specific data may be required for certain plant and wood products.",
    documents: ["Lacey Act Declaration Form", "Species Scientific Name", "Country of Harvest", "Harvest Date", "Commercial Invoice", "Phytosanitary Certificate"],
    additionalInfo: "Required for plants and plant products listed under the Lacey Act",
    url: "https://www.fws.gov/international/laws-treaties-agreements/us-conservation-laws/lacey-act.html"
  },
  AL2: {
    agency: "U.S. Fish and Wildlife Service",
    agencyCode: "USFWS", 
    requirement: "Lacey Act Declaration Required",
    severity: "restricted",
    description: "Lacey Act specific data is required for these plant and wood products.",
    documents: ["Lacey Act Declaration Form", "Import Declaration", "Chain of Custody Documentation", "Harvest License/Permit", "Species Scientific Name", "Country/State of Harvest", "Quantity and Value Declaration"],
    additionalInfo: "Mandatory filing required before importation",
    url: "https://www.fws.gov/international/laws-treaties-agreements/us-conservation-laws/lacey-act.html"
  },
  
  // USDA Agricultural Marketing Service
  AM2: {
    agency: "USDA Agricultural Marketing Service",
    agencyCode: "AMS",
    requirement: "Shell Egg Data Required",
    severity: "restricted",
    description: "USDA/Agricultural Marketing Service Data Related to shell eggs is required.",
    documents: ["Shell Egg Inspection Certificate", "USDA Import Permit", "Grade Certificate", "Candling Certificate", "Health Certificate from Country of Origin", "Commercial Invoice", "Packing List"],
    url: "https://www.ams.usda.gov/"
  },
  AM4: {
    agency: "USDA Agricultural Marketing Service", 
    agencyCode: "AMS",
    requirement: "Marketing Orders Data Required",
    severity: "restricted",
    description: "USDA/Agricultural Marketing Service Data Related to marketing orders is required.",
    documents: ["Marketing Order Certificate", "Grade Certificate", "Quality Inspection Report", "Size Specification Certificate", "Import License", "Commercial Invoice", "Bill of Lading"],
    url: "https://www.ams.usda.gov/"
  },
  AM6: {
    agency: "USDA Agricultural Marketing Service",
    agencyCode: "AMS", 
    requirement: "Peanut Data Required",
    severity: "restricted",
    description: "USDA/Agriculture Marketing Service Data related to peanuts is required.",
    documents: ["Peanut Quality Certificate", "Aflatoxin Test Results", "Foreign Material Test", "Moisture Content Certificate", "Grade Certificate", "Phytosanitary Certificate", "Commercial Invoice"],
    url: "https://www.ams.usda.gov/"
  },
  AM7: {
    agency: "USDA Agricultural Marketing Service",
    agencyCode: "AMS",
    requirement: "Organic Certification May Be Required", 
    severity: "standard",
    description: "USDA/Agriculture Marketing Service Data related to organics may be required.",
    documents: ["Organic Certificate", "Import Certificate", "Transaction Certificate", "Organic System Plan", "NOP Certificate", "Commercial Invoice"],
    url: "https://www.ams.usda.gov/about-ams/programs-offices/national-organic-program"
  },
  AM8: {
    agency: "USDA Agricultural Marketing Service",
    agencyCode: "AMS",
    requirement: "Organic Certification Required",
    severity: "restricted", 
    description: "USDA/Agriculture Marketing Service Data related to organics is required.",
    documents: ["Organic Certificate", "Import Certificate", "Transaction Certificate", "Organic System Plan", "NOP Certificate", "Chain of Custody Documentation", "Commercial Invoice", "Inspection Report"],
    url: "https://www.ams.usda.gov/about-ams/programs-offices/national-organic-program"
  },

  // APHIS
  AQ1: {
    agency: "Animal and Plant Health Inspection Service",
    agencyCode: "APHIS",
    requirement: "APHIS Data May Be Required",
    severity: "standard",
    description: "APHIS data may be required for plant and animal products.",
    documents: ["Phytosanitary Certificate", "Import Permit", "Treatment Certificate", "Commercial Invoice", "Packing List", "Country of Origin Certificate"],
    url: "https://www.aphis.usda.gov/"
  },
  AQ2: {
    agency: "Animal and Plant Health Inspection Service", 
    agencyCode: "APHIS",
    requirement: "APHIS Data Required",
    severity: "restricted",
    description: "APHIS data is required for these plant and animal products.",
    documents: ["Phytosanitary Certificate", "Import Permit", "LACEY Declaration", "Treatment Certificate", "Inspection Certificate", "Health Certificate", "Commercial Invoice", "Species Declaration"],
    url: "https://www.aphis.usda.gov/"
  },
  AQX: {
    agency: "Animal and Plant Health Inspection Service",
    agencyCode: "APHIS", 
    requirement: "APHIS Data May Be Required",
    severity: "standard",
    description: "APHIS Data May be required (no disclaim required).",
    documents: ["Import Documentation", "Commercial Invoice", "Certificate of Origin", "Phytosanitary Certificate"],
    url: "https://www.aphis.usda.gov/"
  },

  // DEA  
  DE1: {
    agency: "U.S. Drug Enforcement Administration",
    agencyCode: "DEA",
    requirement: "DEA Data May Be Required",
    severity: "standard",
    description: "U.S. Drug Enforcement Administration data may be required for controlled substances.",
    documents: ["DEA Import Permit", "DEA Registration Certificate", "Form 236", "Controlled Substance Certificate", "Commercial Invoice", "Certificate of Analysis"],
    url: "https://www.dea.gov/"
  },

  // DOT
  DT1: {
    agency: "DOT/National Highway Traffic Safety Administration",
    agencyCode: "NHTSA",
    requirement: "HS-7 Data May Be Required", 
    severity: "standard",
    description: "DOT/National Highway Traffic Safety Administration HS-7 data may be required for motor vehicles.",
    documents: ["HS-7 Declaration Form", "DOT Compliance Certificate"],
    url: "https://www.nhtsa.gov/"
  },
  DT2: {
    agency: "DOT/National Highway Traffic Safety Administration",
    agencyCode: "NHTSA",
    requirement: "HS-7 Data Required",
    severity: "restricted",
    description: "DOT/National Highway Traffic Safety Administration HS-7 data is required for motor vehicles.",
    documents: ["HS-7 Declaration Form", "DOT Compliance Certificate", "Vehicle Import Form"],
    url: "https://www.nhtsa.gov/"
  },

  // EPA
  EH1: {
    agency: "Environmental Protection Agency",
    agencyCode: "EPA",
    requirement: "Hydrofluorocarbons Data May Be Required",
    severity: "standard", 
    description: "EPA Hydrofluorocarbons data may be required. Only disclaim A allowed.",
    documents: ["EPA Import Certificate", "HFC Declaration"],
    additionalInfo: "Only disclaim A allowed",
    url: "https://www.epa.gov/"
  },
  EH2: {
    agency: "Environmental Protection Agency",
    agencyCode: "EPA",
    requirement: "Hydrofluorocarbons Data Required",
    severity: "restricted",
    description: "EPA Hydrofluorocarbons data is required.",
    documents: ["EPA Import Certificate", "HFC Declaration", "Quota Allocation"],
    url: "https://www.epa.gov/"
  },
  EP1: {
    agency: "Environmental Protection Agency",
    agencyCode: "EPA", 
    requirement: "ODS Data May Be Required",
    severity: "standard",
    description: "ODS Ozone Depleting Substances specific data may be required.",
    documents: ["ODS Import License", "EPA Certificate"],
    url: "https://www.epa.gov/"
  },
  EP3: {
    agency: "Environmental Protection Agency",
    agencyCode: "EPA",
    requirement: "Vehicle and Engines Data May Be Required",
    severity: "standard",
    description: "Vehicle and Engines specific data may be required.",
    documents: ["EPA Certificate of Conformity", "Emissions Certificate"],
    url: "https://www.epa.gov/"
  },
  EP5: {
    agency: "Environmental Protection Agency", 
    agencyCode: "EPA",
    requirement: "Pesticides Data May Be Required",
    severity: "standard",
    description: "Pesticides specific data may be required.",
    documents: ["EPA Pesticide Registration", "FIFRA Certificate"],
    url: "https://www.epa.gov/"
  },
  EP7: {
    agency: "Environmental Protection Agency",
    agencyCode: "EPA",
    requirement: "TSCA Data May Be Required", 
    severity: "standard",
    description: "Toxic Substances Control Act specific data may be required.",
    documents: ["TSCA Certificate", "Chemical Import Declaration"],
    url: "https://www.epa.gov/"
  },

  // FDA
  FD1: {
    agency: "Food and Drug Administration",
    agencyCode: "FDA",
    requirement: "FDA Data May Be Required 801(a)",
    severity: "standard",
    description: "FDA data may be required under section 801(a) for food, drugs, devices, and cosmetics.",
    documents: ["FDA Registration", "Process Filing"],
    url: "https://www.fda.gov/"
  },
  FD2: {
    agency: "Food and Drug Administration",
    agencyCode: "FDA", 
    requirement: "FDA Data Required 801(a)",
    severity: "restricted",
    description: "FDA data is required under section 801(a) for food, drugs, devices, and cosmetics.",
    documents: ["FDA Registration", "Process Filing", "FDA Import Alert Clearance"],
    url: "https://www.fda.gov/"
  },
  FD3: {
    agency: "Food and Drug Administration",
    agencyCode: "FDA",
    requirement: "FDA Prior Notice May Be Required 801(m)",
    severity: "standard",
    description: "FDA Prior Notice Data may be required under section 801(m) for food imports.",
    documents: ["Prior Notice Confirmation", "FDA Registration Number"],
    additionalInfo: "Must be submitted 2-8 hours before arrival",
    url: "https://www.fda.gov/food/importing-food-products-united-states/prior-notice-imported-foods"
  },
  FD4: {
    agency: "Food and Drug Administration",
    agencyCode: "FDA",
    requirement: "FDA Prior Notice Required 801(m)", 
    severity: "restricted",
    description: "FDA Prior Notice Data is required under section 801(m) for food imports.",
    documents: ["Prior Notice Confirmation", "FDA Registration Number", "Food Facility Registration"],
    additionalInfo: "Must be submitted 2-8 hours before arrival",
    url: "https://www.fda.gov/food/importing-food-products-united-states/prior-notice-imported-foods"
  },

  // FSIS
  FS3: {
    agency: "Food Safety and Inspection Service",
    agencyCode: "FSIS",
    requirement: "FSIS Data May Be Required",
    severity: "standard",
    description: "FSIS data may be required. Applicable to all FSIS programs for meat, poultry, and egg products.",
    documents: ["FSIS Import Certificate", "Export Certificate"],
    url: "https://www.fsis.usda.gov/"
  },
  FS4: {
    agency: "Food Safety and Inspection Service",
    agencyCode: "FSIS",
    requirement: "FSIS Data Required",
    severity: "restricted",
    description: "FSIS data is required. Applicable to all FSIS programs for meat, poultry, and egg products.",
    documents: ["FSIS Import Certificate", "Export Certificate", "HACCP Certification"],
    url: "https://www.fsis.usda.gov/"
  },

  // Fish and Wildlife Service
  FW1: {
    agency: "U.S. Fish and Wildlife Service", 
    agencyCode: "USFWS",
    requirement: "FWS Notification May Be Required",
    severity: "standard",
    description: "Fish and Wildlife Service (FWS) notification may be required for wildlife products.",
    documents: ["CITES Permit", "FWS Declaration"],
    url: "https://www.fws.gov/"
  },
  FW2: {
    agency: "U.S. Fish and Wildlife Service",
    agencyCode: "USFWS",
    requirement: "FWS Data Required",
    severity: "restricted",
    description: "U.S. Fish and Wildlife Service data is required for wildlife and plant products.",
    documents: ["CITES Permit", "FWS Declaration", "Wildlife Import License"],
    url: "https://www.fws.gov/"
  },
  FW3: {
    agency: "U.S. Fish and Wildlife Service",
    agencyCode: "USFWS",
    requirement: "FWS Data May Be Required",
    severity: "standard", 
    description: "U.S. Fish and Wildlife Service data may be required, which can only be disclaimed using code C or D.",
    documents: ["CITES Documentation"],
    additionalInfo: "Can only be disclaimed using code C or D",
    url: "https://www.fws.gov/"
  },

  // NMFS/NOAA
  NM1: {
    agency: "National Marine Fisheries Service",
    agencyCode: "NMFS",
    requirement: "370 Specific Data May Be Required",
    severity: "standard",
    description: "370 specific data may be required for marine fisheries products.",
    documents: ["Fisheries Certificate", "Catch Documentation"],
    url: "https://www.fisheries.noaa.gov/"
  },
  NM2: {
    agency: "National Marine Fisheries Service",
    agencyCode: "NMFS", 
    requirement: "370 Specific Data Required",
    severity: "restricted",
    description: "370 specific data is required for marine fisheries products.",
    documents: ["Fisheries Certificate", "Catch Documentation", "Vessel Registration"],
    url: "https://www.fisheries.noaa.gov/"
  },
  NM4: {
    agency: "National Marine Fisheries Service",
    agencyCode: "NMFS",
    requirement: "Antarctic Marine Living Resources Data Required",
    severity: "restricted",
    description: "Antarctic Marine Living Resources specific data is required.",
    documents: ["CCAMLR Certificate", "Catch Documentation", "Vessel License"],
    url: "https://www.fisheries.noaa.gov/"
  },
  NM5: {
    agency: "National Marine Fisheries Service",
    agencyCode: "NMFS",
    requirement: "Highly Migratory Species Data May Be Required", 
    severity: "standard",
    description: "Highly Migratory Species specific data may be required.",
    documents: ["HMS Permit", "Statistical Document"],
    url: "https://www.fisheries.noaa.gov/"
  },
  NM6: {
    agency: "National Marine Fisheries Service",
    agencyCode: "NMFS",
    requirement: "Highly Migratory Species Data Required",
    severity: "restricted",
    description: "Highly Migratory Species specific data is required.",
    documents: ["HMS Permit", "Statistical Document", "Catch Certificate"],
    url: "https://www.fisheries.noaa.gov/"
  },
  NM8: {
    agency: "National Marine Fisheries Service",
    agencyCode: "NMFS",
    requirement: "Seafood Import Monitoring Program Required",
    severity: "restricted",
    description: "Seafood Import Monitoring Program specific data is required.",
    documents: ["SIMP Compliance Form", "Catch Certificate", "Landing Document"],
    additionalInfo: "Electronic filing through ITDS required",
    url: "https://www.fisheries.noaa.gov/international/seafood-import-monitoring-program"
  },

  // State Department
  OM2: {
    agency: "U.S. Department of State",
    agencyCode: "STATE",
    requirement: "Marine Conservation Data Required",
    severity: "restricted",
    description: "U.S. Department of State, Bureau of Oceans and International Environmental and Scientific Affairs, Office of Marine Conservation data is required.",
    documents: ["State Department Certificate", "Marine Conservation Documentation"],
    url: "https://www.state.gov/"
  },

  // TTB
  TB1: {
    agency: "Alcohol and Tobacco Tax and Trade Bureau",
    agencyCode: "TTB",
    requirement: "TTB Data May Be Required",
    severity: "standard",
    description: "TTB data may be required. Applicable to all TTB programs for alcohol, tobacco, and firearms.",
    documents: ["TTB Certificate", "COLAs", "Import Permit"],
    additionalInfo: "Need to add TTB's program codes",
    url: "https://www.ttb.gov/"
  },
  TB3: {
    agency: "Alcohol and Tobacco Tax and Trade Bureau", 
    agencyCode: "TTB",
    requirement: "TTB Data May Be Required",
    severity: "standard",
    description: "TTB data may be required, which can only be disclaimed using codes A or C.",
    documents: ["TTB Documentation"],
    additionalInfo: "Can only be disclaimed using codes A or C",
    url: "https://www.ttb.gov/"
  }
};

const TradeComplianceFlags: React.FC<TradeComplianceFlagsProps> = ({ initialHsCode = "" }) => {
  const { userId } = useAuth();
  const { checkFeatureAccess, recordUsage } = useUsageLimits();
  const [hsCode, setHsCode] = useState(initialHsCode);
  const [hsCodeInput, setHsCodeInput] = useState(initialHsCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Past classifications state
  const [pastClassifications, setPastClassifications] = useState<ClassificationRecord[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Results state
  const [pgaFlags, setPgaFlags] = useState<PGAFlag[]>([]);
  const [cvdFlags, setCvdFlags] = useState<CVDFlag[]>([]);
  const [hasResults, setHasResults] = useState(false);
  
  // Filter state
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Load past classifications on mount
  useEffect(() => {
    if (userId) {
      loadPastClassifications();
    }
  }, [userId]);

  const loadPastClassifications = async () => {
    if (!userId) return;
    try {
      const classifications = await getUserClassifications(userId, 20);
      setPastClassifications(classifications);
    } catch (error) {
      console.error('Error loading past classifications:', error);
    }
  };

  const selectHsCode = (code: string) => {
    setHsCode(code);
    setHsCodeInput(code);
    setShowDropdown(false);
  };

  const filteredClassifications = pastClassifications.filter(c => 
    c.hs_code.toLowerCase().includes(hsCodeInput.toLowerCase()) ||
    c.product_description.toLowerCase().includes(hsCodeInput.toLowerCase())
  );

  // Helper function to convert HS code to 4-part format
  const formatHsCodeForApi = (code: string) => {
    // Remove any non-numeric characters
    const numericCode = code.replace(/[^0-9]/g, '');
    
    // Ensure it's at least 10 digits, pad with zeros if needed
    const paddedCode = numericCode.padEnd(10, '0');
    
    // Format as XX.XX.XX.XX
    return `${paddedCode.slice(0, 4)}.${paddedCode.slice(4, 6)}.${paddedCode.slice(6, 8)}.${paddedCode.slice(8, 10)}`;
  };

  // Helper function to map PGA response to PGAFlag objects
  const mapPgaResponseToFlags = (response: PGAResponse): PGAFlag[] => {
    const flags: PGAFlag[] = [];
    
    response.flagged_pgas.forEach(code => {
      const mapping = TRADE_PROGRAM_MAPPING[code];
      if (mapping) {
        flags.push({
          id: code,
          ...mapping
        });
      }
    });

    // If no flags found, add a default "no requirements" flag
    if (flags.length === 0) {
      flags.push({
        id: "none",
        agency: "No Special Requirements",
        agencyCode: "NONE",
        requirement: "Standard Import Procedures",
        severity: "none",
        description: "This HS code does not have any special PGA requirements. Standard customs procedures apply.",
        documents: ["Commercial Invoice", "Packing List", "Bill of Lading"]
      });
    }

    return flags;
  };

  // Real API call
  const fetchComplianceFlags = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Format the HS code for API
      const formattedCode = formatHsCodeForApi(code);
      
      // Make parallel API calls
      const [pgaResponse, cvdResponse, addResponse] = await Promise.all([
        fetch(`https://data-api-rose.vercel.app/search-pga?hs_code=${formattedCode}`),
        fetch(`https://data-api-rose.vercel.app/search-cvd?hs_code=${formattedCode}`),
        fetch(`https://data-api-rose.vercel.app/search-add?hs_code=${formattedCode}`)
      ]);

      if (!pgaResponse.ok || !cvdResponse.ok || !addResponse.ok) {
        throw new Error('API request failed');
      }

      const [pgaData, cvdData, addData] = await Promise.all([
        pgaResponse.json() as Promise<PGAResponse>,
        cvdResponse.json() as Promise<CVDResponse>,
        addResponse.json() as Promise<CVDResponse>
      ]);

      // Map PGA response to flags
      const pgaFlags = mapPgaResponseToFlags(pgaData);
      setPgaFlags(pgaFlags);

      // Handle CVD/ADD flags
      const dutyFlags: CVDFlag[] = [];
      
      // Note: The current API only returns boolean flags, not detailed duty information
      // We'll need to enhance this when more detailed ADD/CVD data becomes available
      if (cvdData.total_flagged > 0) {
        dutyFlags.push({
          id: 'cvd-detected',
          type: 'CVD',
          rate: 0, // API doesn't provide rate yet
          country: 'Multiple Countries', // API doesn't provide country yet
          effectiveDate: new Date().toISOString().split('T')[0], // Placeholder
          caseNumber: 'TBD', // API doesn't provide case number yet
          status: 'active',
          description: 'Countervailing duties detected for this HS code. Contact customs broker for detailed rate information.',
          productScope: 'Products under this HS classification'
        });
      }

      if (addData.total_flagged > 0) {
        dutyFlags.push({
          id: 'add-detected',
          type: 'ADD',
          rate: 0, // API doesn't provide rate yet
          country: 'Multiple Countries', // API doesn't provide country yet
          effectiveDate: new Date().toISOString().split('T')[0], // Placeholder
          caseNumber: 'TBD', // API doesn't provide case number yet
          status: 'active',
          description: 'Anti-dumping duties detected for this HS code. Contact customs broker for detailed rate information.',
          productScope: 'Products under this HS classification'
        });
      }

      setCvdFlags(dutyFlags);
      setHasResults(true);
      setLoading(false);
      
    } catch (err) {
      console.error('API Error:', err);
      setError("Failed to fetch compliance flags. Please try again.");
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!hsCode || hsCode.length < 6) {
      setError("Please enter a valid HS code (at least 6 digits)");
      return;
    }

    // Check if user can access PGA calculator feature
    const canAccess = await checkFeatureAccess('pgaCalculator');
    if (!canAccess) {
      return; // Error message already shown by checkFeatureAccess
    }

    // Record usage
    const usageRecorded = await recordUsage('pgaCalculator');
    if (!usageRecorded) {
      setError("Failed to record usage. Please try again.");
      return;
    }

    // Proceed with the search
    fetchComplianceFlags(hsCode);
  };

  // Filter functions
  const filteredPgaFlags = pgaFlags.filter(flag => 
    severityFilter === "all" || flag.severity === severityFilter
  );

  const filteredCvdFlags = cvdFlags.filter(flag => 
    statusFilter === "all" || flag.status === statusFilter
  );

  // Get elegant severity styling
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'none':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-800',
          icon: CheckCircle2
        };
      case 'standard':
        return {
          bg: 'bg-primary/10',
          text: 'text-primary',
          border: 'border-primary/20',
          icon: Info
        };
      case 'restricted':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/20',
          text: 'text-purple-800 dark:text-purple-200',
          border: 'border-purple-200 dark:border-purple-800',
          icon: Shield
        };
      default:
        return {
          bg: 'bg-secondary',
          text: 'text-secondary-foreground',
          border: 'border-border',
          icon: Info
        };
    }
  };

  // Get elegant status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-primary/10',
          text: 'text-primary',
          border: 'border-primary/20',
          icon: Zap
        };
      case 'suspended':
        return {
          bg: 'bg-secondary/50',
          text: 'text-muted-foreground',
          border: 'border-border',
          icon: Clock
        };
      case 'revoked':
        return {
          bg: 'bg-muted/50',
          text: 'text-muted-foreground',
          border: 'border-muted',
          icon: Eye
        };
      default:
        return {
          bg: 'bg-secondary',
          text: 'text-secondary-foreground',
          border: 'border-border',
          icon: Info
        };
    }
  };

  // Export functionality
  const handleExport = () => {
    // TODO: Implement PDF export
    console.log("Exporting compliance report...");
  };

  return (
    <div className="w-full max-w-6xl mx-auto" style={{ fontFamily: 'var(--font-sf-pro-display)' }}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Trade Compliance Flags</h1>
          <p className="text-muted-foreground mt-2">
            Check PGA requirements and ADD/CVD duties for your HS code
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <label htmlFor="hsCode" className="text-sm font-medium">
                Enter HS Code
              </label>
              <div className="relative">
                <input
                  id="hsCode"
                  type="text"
                  value={hsCodeInput}
                  onChange={(e) => {
                    setHsCodeInput(e.target.value);
                    setHsCode(e.target.value);
                    setShowDropdown(e.target.value.length > 0 && pastClassifications.length > 0);
                  }}
                  onFocus={() => setShowDropdown(pastClassifications.length > 0)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Enter 6-10 digit HS code or search past classifications"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {pastClassifications.length > 0 && (
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showDropdown && "rotate-180")} />
                  )}
                </div>
                
                {/* Dropdown for past classifications */}
                {showDropdown && filteredClassifications.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-border">
                      <p className="text-xs text-muted-foreground font-medium">Recent Classifications</p>
                    </div>
                    {filteredClassifications.slice(0, 10).map((classification) => (
                      <div
                        key={classification.id}
                        onClick={() => selectHsCode(classification.hs_code)}
                        className="p-3 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-medium text-sm">{classification.hs_code}</p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {classification.product_description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <CustomButton
                onClick={handleSearch}
                disabled={loading || !hsCode || hsCode.length < 6}
                size="lg"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Compliance...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check Compliance
                  </>
                )}
              </CustomButton>
              
              {hasResults && (
                <CustomButton
                  variant="outline"
                  onClick={handleExport}
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </CustomButton>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {hasResults && !loading && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Compliance Requirements for {hsCode}</h2>
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </CustomButton>
            </div>

            {showFilters && (
              <div className="bg-secondary/50 p-4 rounded-lg flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">PGA Severity:</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="text-sm border rounded-lg px-2 py-1"
                  >
                    <option value="all">All</option>
                    <option value="none">None</option>
                    <option value="standard">Standard</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">ADD/CVD Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border rounded-lg px-2 py-1"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
              </div>
            )}

            {/* PGA Flags Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Partner Government Agency (PGA) Requirements</h3>
              </div>
              
              <div className="grid gap-4">
                {filteredPgaFlags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No PGA requirements match your filter criteria.
                  </div>
                ) : (
                  filteredPgaFlags.map((flag) => (
                    <div key={flag.id} className="glass-card rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <h4 className="font-semibold">{flag.agency}</h4>
                            <span className="text-sm text-muted-foreground">({flag.agencyCode})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const style = getSeverityStyle(flag.severity);
                              const IconComponent = style.icon;
                              return (
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                                  style.bg,
                                  style.text,
                                  style.border
                                )}>
                                  <IconComponent className="h-3 w-3" />
                                  {flag.requirement}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        {flag.url && (
                          <a
                            href={flag.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                      
                      {flag.documents && flag.documents.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Required Documents:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {flag.documents.map((doc, index) => (
                              <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {flag.additionalInfo && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                          <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {flag.additionalInfo}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ADD/CVD Flags Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Anti-Dumping & Countervailing Duties (ADD/CVD)</h3>
              </div>
              
              {filteredCvdFlags.length === 0 ? (
                <div className="glass-card rounded-lg p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium">No ADD/CVD Duties Apply</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This HS code is not subject to any anti-dumping or countervailing duties.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredCvdFlags.map((flag) => (
                    <div key={flag.id} className="glass-card rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Flag className="h-5 w-5 text-muted-foreground" />
                            <h4 className="font-semibold">
                              {flag.type === 'ADD' ? 'Anti-Dumping Duty' : 'Countervailing Duty'}
                            </h4>
                            {(() => {
                              const style = getStatusStyle(flag.status);
                              const IconComponent = style.icon;
                              return (
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                                  style.bg,
                                  style.text,
                                  style.border
                                )}>
                                  <IconComponent className="h-3 w-3" />
                                  {flag.status.charAt(0).toUpperCase() + flag.status.slice(1)}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {flag.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Effective: {new Date(flag.effectiveDate).toLocaleDateString()}
                            </span>
                            {flag.expiryDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires: {new Date(flag.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{flag.rate}%</p>
                          <p className="text-xs text-muted-foreground">Additional Duty</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Case Number:</p>
                          <p className="text-muted-foreground font-mono">{flag.caseNumber}</p>
                        </div>
                        {flag.productScope && (
                          <div>
                            <p className="font-medium">Product Scope:</p>
                            <p className="text-muted-foreground">{flag.productScope}</p>
                          </div>
                        )}
                      </div>
                      
                      {flag.status === 'suspended' && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                          <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            This duty is currently suspended. Check with customs for current status.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="bg-primary/10 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-6">Compliance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20">
                  <p className="text-3xl font-bold mb-2">{pgaFlags.length}</p>
                  <p className="text-sm text-muted-foreground text-center">PGA Requirements</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20">
                  <p className="text-3xl font-bold mb-2">{cvdFlags.filter(f => f.status === 'active').length}</p>
                  <p className="text-sm text-muted-foreground text-center">Active ADD/CVD Duties</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20">
                  <p className="text-3xl font-bold mb-2">
                    {cvdFlags.filter(f => f.status === 'active').reduce((sum, f) => sum + f.rate, 0)}%
                  </p>
                  <p className="text-sm text-muted-foreground text-center">Total Additional Duties</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <CustomButton
                variant="outline"
                onClick={() => {
                  setHsCode("");
                  setHsCodeInput("");
                  setHasResults(false);
                  setPgaFlags([]);
                  setCvdFlags([]);
                }}
              >
                Check Another Code
              </CustomButton>
              <CustomButton
                onClick={() => window.location.href = `/tariff-calculator?hsCode=${hsCode}`}
              >
                Calculate Tariffs
              </CustomButton>
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">About Trade Compliance Flags</h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>
              <strong>PGA Requirements:</strong> Partner Government Agencies may have specific requirements 
              for importing certain products. These can include permits, certifications, or prior notices.
            </p>
            <p>
              <strong>ADD/CVD Duties:</strong> Anti-dumping and countervailing duties are additional tariffs 
              imposed to protect domestic industries from unfair foreign competition.
            </p>
            <p>
              Always verify current requirements with the relevant agencies and consult with a customs broker 
              for complex shipments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeComplianceFlags;
