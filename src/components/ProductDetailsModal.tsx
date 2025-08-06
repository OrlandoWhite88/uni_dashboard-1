import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TariffInfo from "@/components/TariffInfo";
import HSCodeSubtree from "@/components/HSCodeSubtree";
import { ClassificationRecord } from "@/lib/supabaseService";
import { 
  Package, 
  Globe, 
  DollarSign, 
  Calendar, 
  Building, 
  Tag, 
  FileText,
  Edit2,
  Save,
  X,
  Calculator,
  TrendingUp,
  Weight,
  Truck
} from "lucide-react";
import CustomButton from "@/components/ui/CustomButton";
import { useNavigate } from "react-router-dom";
import { updateClassification } from "@/lib/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "./TariffCalculator";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classification: ClassificationRecord | null;
  onUpdate?: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  classification,
  onUpdate
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classification) {
      setEditedData({
        product_description: classification.product_description || "",
        notes: classification.notes || "",
        origin_country: classification.origin_country || "",
        typical_value: classification.typical_value || "",
        typical_quantity: classification.typical_quantity || "",
        quantity_unit: classification.quantity_unit || "",
        weight_kg: classification.weight_kg || "",
        import_frequency: classification.import_frequency || "",
        annual_import_value: classification.annual_import_value || "",
        incoterms: classification.incoterms || "",
      });
    }
  }, [classification]);

  if (!classification) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data
    setEditedData({
      product_description: classification.product_description || "",
      notes: classification.notes || "",
      origin_country: classification.origin_country || "",
      typical_value: classification.typical_value || "",
      typical_quantity: classification.typical_quantity || "",
      quantity_unit: classification.quantity_unit || "",
      weight_kg: classification.weight_kg || "",
      import_frequency: classification.import_frequency || "",
      annual_import_value: classification.annual_import_value || "",
      incoterms: classification.incoterms || "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateClassification(classification.id!, editedData);
      if (updated) {
        toast({
          title: "Success",
          description: "Product details updated successfully",
        });
        setIsEditing(false);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error updating classification:", error);
      toast({
        title: "Error",
        description: "Failed to update product details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateDuty = () => {
    // Pass all the product data to the tariff calculator
    const params = new URLSearchParams({
      hsCode: classification.hs_code,
      description: classification.product_description || "",
      originCountry: classification.origin_country || "",
      invoiceValue: classification.typical_value?.toString() || "",
      quantity: classification.typical_quantity?.toString() || "",
      weight: classification.weight_kg?.toString() || "",
      quantityUnit: classification.quantity_unit || "",
    });
    
    navigate(`/tariff-calculator?${params.toString()}`);
    onClose();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getCountryName = (code: string | null) => {
    if (!code) return "N/A";
    const country = COUNTRIES.find(c => c.code === code);
    return country ? country.name : code;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Product Classification Details</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                HS Code: {classification.hs_code}
                {classification.confidence && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {Math.round(classification.confidence)}% confidence
                  </span>
                )}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <CustomButton
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </CustomButton>
                  <CustomButton
                    onClick={handleCalculateDuty}
                    variant="default"
                    size="sm"
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Calculate Duty
                  </CustomButton>
                </>
              ) : (
                <>
                  <CustomButton
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </CustomButton>
                  <CustomButton
                    onClick={handleSave}
                    variant="default"
                    size="sm"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? "Saving..." : "Save"}
                  </CustomButton>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="tariff">Tariff Information</TabsTrigger>
            <TabsTrigger value="validate">Validate Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-0 space-y-6">
            {/* Basic Information */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Product Description</label>
                  {isEditing ? (
                    <textarea
                      value={editedData.product_description}
                      onChange={(e) => setEditedData({...editedData, product_description: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{classification.product_description || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Classification Date</label>
                  <p className="text-sm font-medium mt-1">{formatDate(classification.classification_date)}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Notes</label>
                  {isEditing ? (
                    <textarea
                      value={editedData.notes}
                      onChange={(e) => setEditedData({...editedData, notes: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{classification.notes || "N/A"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Trade Information */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Trade Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Country of Origin</label>
                  {isEditing ? (
                    <select
                      value={editedData.origin_country}
                      onChange={(e) => setEditedData({...editedData, origin_country: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{getCountryName(classification.origin_country)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Typical Value</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.typical_value}
                      onChange={(e) => setEditedData({...editedData, typical_value: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.01"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{formatCurrency(classification.typical_value)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Annual Import Value</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.annual_import_value}
                      onChange={(e) => setEditedData({...editedData, annual_import_value: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.01"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{formatCurrency(classification.annual_import_value)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Typical Quantity</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.typical_quantity}
                      onChange={(e) => setEditedData({...editedData, typical_quantity: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.001"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {classification.typical_quantity || "N/A"} {classification.quantity_unit || ""}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Weight (kg)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.weight_kg}
                      onChange={(e) => setEditedData({...editedData, weight_kg: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.001"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{classification.weight_kg || "N/A"} kg</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Import Frequency</label>
                  {isEditing ? (
                    <select
                      value={editedData.import_frequency}
                      onChange={(e) => setEditedData({...editedData, import_frequency: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select frequency</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="biannual">Twice a Year</option>
                      <option value="annual">Annually</option>
                      <option value="occasional">Occasional</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium mt-1 capitalize">{classification.import_frequency || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Incoterms</label>
                  {isEditing ? (
                    <select
                      value={editedData.incoterms}
                      onChange={(e) => setEditedData({...editedData, incoterms: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select incoterms</option>
                      <option value="EXW">EXW - Ex Works</option>
                      <option value="FCA">FCA - Free Carrier</option>
                      <option value="CPT">CPT - Carriage Paid To</option>
                      <option value="CIP">CIP - Carriage and Insurance Paid To</option>
                      <option value="DAP">DAP - Delivered at Place</option>
                      <option value="DPU">DPU - Delivered at Place Unloaded</option>
                      <option value="DDP">DDP - Delivered Duty Paid</option>
                      <option value="FAS">FAS - Free Alongside Ship</option>
                      <option value="FOB">FOB - Free on Board</option>
                      <option value="CFR">CFR - Cost and Freight</option>
                      <option value="CIF">CIF - Cost, Insurance and Freight</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{classification.incoterms || "N/A"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Classification Metadata */}
            {classification.classification_method && (
              <div className="bg-muted/20 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Classification Metadata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Method</label>
                    <p className="text-sm font-medium mt-1 capitalize">{classification.classification_method}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Source</label>
                    <p className="text-sm font-medium mt-1">{classification.is_manual_entry ? "Manual Entry" : "AI Classification"}</p>
                  </div>
                  {classification.confidence && (
                    <div>
                      <label className="text-sm text-muted-foreground">Confidence</label>
                      <p className="text-sm font-medium mt-1">{Math.round(classification.confidence)}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tariff" className="mt-0">
            <TariffInfo hsCode={classification.hs_code} />
          </TabsContent>
          
          <TabsContent value="validate" className="mt-0">
            <HSCodeSubtree hsCode={classification.hs_code} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
