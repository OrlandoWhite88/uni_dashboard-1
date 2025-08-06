import React, { useState } from 'react';
import { X, Plus, Package, Globe, DollarSign, Weight, FileText, Tag, Building, AlertCircle, Loader2 } from 'lucide-react';
import CustomButton from './ui/CustomButton';
import { useToast } from '@/hooks/use-toast';
import { saveClassification, ClassificationRecord } from '@/lib/supabaseService';
import { getTariffInfo } from '@/lib/classifierService';
import { COUNTRIES } from './TariffCalculator';

interface QuickAddClassificationProps {
  userId: string;
  userEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const INCOTERMS = [
  { value: 'EXW', label: 'EXW - Ex Works' },
  { value: 'FCA', label: 'FCA - Free Carrier' },
  { value: 'CPT', label: 'CPT - Carriage Paid To' },
  { value: 'CIP', label: 'CIP - Carriage and Insurance Paid To' },
  { value: 'DAP', label: 'DAP - Delivered at Place' },
  { value: 'DPU', label: 'DPU - Delivered at Place Unloaded' },
  { value: 'DDP', label: 'DDP - Delivered Duty Paid' },
  { value: 'FAS', label: 'FAS - Free Alongside Ship' },
  { value: 'FOB', label: 'FOB - Free on Board' },
  { value: 'CFR', label: 'CFR - Cost and Freight' },
  { value: 'CIF', label: 'CIF - Cost, Insurance and Freight' },
];

const IMPORT_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannual', label: 'Twice a Year' },
  { value: 'annual', label: 'Annually' },
  { value: 'occasional', label: 'Occasional' },
];

const QUANTITY_UNITS = [
  { value: 'PCS', label: 'Pieces' },
  { value: 'KG', label: 'Kilograms' },
  { value: 'MT', label: 'Metric Tons' },
  { value: 'L', label: 'Liters' },
  { value: 'M', label: 'Meters' },
  { value: 'M2', label: 'Square Meters' },
  { value: 'M3', label: 'Cubic Meters' },
  { value: 'DOZ', label: 'Dozen' },
  { value: 'GROSS', label: 'Gross' },
  { value: 'PACK', label: 'Pack' },
];

const QuickAddClassification: React.FC<QuickAddClassificationProps> = ({
  userId,
  userEmail,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingTariff, setFetchingTariff] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'trade'>('basic');
  
  const [formData, setFormData] = useState({
    // Basic Information
    hsCode: '',
    productDescription: '',
    notes: '',
    
    // Trade Information
    originCountry: '',
    typicalValue: '',
    typicalQuantity: '',
    quantityUnit: 'PCS',
    weightKg: '',
    incoterms: 'FOB',
    importFrequency: 'monthly',
    annualImportValue: '',
  });

  const [tariffData, setTariffData] = useState<any>(null);

  // Check if weight is required for calculation (same logic as TariffCalculator)
  const isWeightRequiredForCalculation = (): boolean => {
    if (!tariffData) return false;
    return tariffData.quantity_1_code === 'KG' ||
           (tariffData.mfn_text_rate && tariffData.mfn_text_rate.toString().toLowerCase().includes('kg'));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fetch tariff data when HS code is complete
    if (name === 'hsCode' && value.length >= 6) {
      fetchTariffData(value);
    }
  };

  const fetchTariffData = async (hsCode: string) => {
    setFetchingTariff(true);
    try {
      const data = await getTariffInfo(hsCode);
      setTariffData(data);
      
      // Auto-populate description if available
      if (data?.brief_description && !formData.productDescription) {
        setFormData(prev => ({
          ...prev,
          productDescription: data.brief_description
        }));
      }
    } catch (error) {
      console.error('Error fetching tariff data:', error);
    } finally {
      setFetchingTariff(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.hsCode || formData.hsCode.length < 6) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid HS code (at least 6 digits)",
        variant: "destructive",
      });
      return;
    }

    if (!formData.productDescription) {
      toast({
        title: "Validation Error",
        description: "Please enter a product description",
        variant: "destructive",
      });
      return;
    }

    // Validate weight if required
    if (isWeightRequiredForCalculation() && !formData.weightKg) {
      toast({
        title: "Validation Error",
        description: "Weight is required for this HS code due to weight-based tariff rates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create classification record with essential fields only
      const classification: ClassificationRecord & any = {
        user_id: userId,
        user_email: userEmail,
        hs_code: formData.hsCode,
        product_description: formData.productDescription,
        notes: formData.notes,
        tariff_data: tariffData,
        is_manual_entry: true,
        
        // Essential trade fields
        origin_country: formData.originCountry || null,
        typical_value: formData.typicalValue ? parseFloat(formData.typicalValue) : null,
        typical_quantity: formData.typicalQuantity ? parseFloat(formData.typicalQuantity) : null,
        quantity_unit: formData.quantityUnit || null,
        weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        incoterms: formData.incoterms || null,
        import_frequency: formData.importFrequency || null,
        annual_import_value: formData.annualImportValue ? parseFloat(formData.annualImportValue) : null,
        
        // Remove supplier and tags fields
        supplier_info: null,
        product_tags: [],
        fta_certificates: null,
      };

      const result = await saveClassification(classification);
      
      if (result) {
        toast({
          title: "Success",
          description: "Product classification added successfully",
        });
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to save classification');
      }
    } catch (error) {
      console.error('Error saving classification:', error);
      toast({
        title: "Error",
        description: "Failed to add classification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Quick Add Product</h2>
              <p className="text-gray-600 mt-1">Manually add a product with its HS code and essential details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Simplified Tabs - Only Basic and Trade */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium flex-1 ${
                activeTab === 'basic'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('trade')}
              className={`px-6 py-3 font-medium flex-1 ${
                activeTab === 'trade'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Trade Details
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HS Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="hsCode"
                    value={formData.hsCode}
                    onChange={handleInputChange}
                    placeholder="Enter 6-10 digit HS code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {fetchingTariff && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {tariffData && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✓ Tariff data found: {tariffData.mfn_text_rate || 'Free'}
                    </p>
                    {isWeightRequiredForCalculation() && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Weight required for this HS code (weight-based tariff rates)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="productDescription"
                  value={formData.productDescription}
                  onChange={handleInputChange}
                  placeholder="Enter detailed product description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes or comments"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'trade' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Country of Origin
                  </label>
                  <select
                    name="originCountry"
                    value={formData.originCountry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Typical Invoice Value (USD)
                  </label>
                  <input
                    type="number"
                    name="typicalValue"
                    value={formData.typicalValue}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="inline h-4 w-4 mr-1" />
                    Typical Quantity
                  </label>
                  <input
                    type="number"
                    name="typicalQuantity"
                    value={formData.typicalQuantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    name="quantityUnit"
                    value={formData.quantityUnit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {QUANTITY_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Smart weight field - only show when required */}
                {isWeightRequiredForCalculation() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Weight className="inline h-4 w-4 mr-1" />
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="weightKg"
                      value={formData.weightKg}
                      onChange={handleInputChange}
                      placeholder="0.000"
                      step="0.001"
                      className="w-full px-4 py-2 border border-orange-300 bg-orange-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-orange-600 mt-1">Required for this HS code</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incoterms
                  </label>
                  <select
                    name="incoterms"
                    value={formData.incoterms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INCOTERMS.map(term => (
                      <option key={term.value} value={term.value}>
                        {term.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Frequency
                  </label>
                  <select
                    name="importFrequency"
                    value={formData.importFrequency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {IMPORT_FREQUENCIES.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Annual Import Value (USD)
                </label>
                <input
                  type="number"
                  name="annualImportValue"
                  value={formData.annualImportValue}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'supplier' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  placeholder="Enter supplier company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Country
                  </label>
                  <select
                    name="supplierCountry"
                    value={formData.supplierCountry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Contact
                  </label>
                  <input
                    type="text"
                    name="supplierContact"
                    value={formData.supplierContact}
                    onChange={handleInputChange}
                    placeholder="Email or phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Product Tags
                </label>
                <input
                  type="text"
                  name="productTags"
                  value={formData.productTags}
                  onChange={handleInputChange}
                  placeholder="Enter tags separated by commas (e.g., electronics, consumer goods)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  FTA Certificates
                </label>
                <input
                  type="text"
                  name="ftaCertificates"
                  value={formData.ftaCertificates}
                  onChange={handleInputChange}
                  placeholder="Certificate numbers or types (e.g., USMCA, GSP)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">List applicable FTA certificates</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Fields marked with * are required</span>
            </div>
            <div className="flex gap-3">
              <CustomButton
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={handleSubmit}
                disabled={loading || !formData.hsCode || !formData.productDescription || (isWeightRequiredForCalculation() && !formData.weightKg)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </>
                )}
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddClassification;
