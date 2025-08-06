import React, { useState, useEffect } from 'react';
import { X, Plus, Package, Globe, DollarSign, Weight, FileText, AlertCircle, Loader2, Info, CheckCircle2 } from 'lucide-react';
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
  const [tariffData, setTariffData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    // Basic Information
    hsCode: '',
    productDescription: '',
    notes: '',
    
    // Trade Information
    originCountry: '',
    typicalValue: '',
    typicalQuantity: '',
    quantityUnit: '',
    weightKg: '',
    incoterms: 'FOB',
    importFrequency: 'monthly',
    annualImportValue: '',
  });

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
      
      // Auto-populate fields from tariff data
      if (data) {
        setFormData(prev => ({
          ...prev,
          productDescription: data.brief_description || prev.productDescription,
          // Auto-set quantity unit from tariff data
          quantityUnit: data.quantity_1_code || prev.quantityUnit
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

    setLoading(true);
    try {
      // Create classification record with enhanced fields
      const classification: ClassificationRecord = {
        user_id: userId,
        user_email: userEmail,
        hs_code: formData.hsCode,
        product_description: formData.productDescription,
        notes: formData.notes,
        tariff_data: tariffData,
        is_manual_entry: true,
        
        // Enhanced fields
        origin_country: formData.originCountry || null,
        typical_value: formData.typicalValue ? parseFloat(formData.typicalValue) : null,
        typical_quantity: formData.typicalQuantity ? parseFloat(formData.typicalQuantity) : null,
        quantity_unit: formData.quantityUnit || null,
        weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        incoterms: formData.incoterms || null,
        import_frequency: formData.importFrequency || null,
        annual_import_value: formData.annualImportValue ? parseFloat(formData.annualImportValue) : null,
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add Product Classification</h2>
              <p className="text-gray-600 mt-1">Manually add a product with its HS code</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('trade')}
              className={`px-6 py-3 font-medium transition-colors ${
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
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-green-800 font-medium">
                          Tariff data found
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          MFN Rate: {tariffData.mfn_text_rate || 'Free'}
                          {tariffData.quantity_1_code && (
                            <span className="ml-2">• Unit: {tariffData.quantity_1_code}</span>
                          )}
                        </p>
                      </div>
                    </div>
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
                {tariffData?.brief_description && formData.productDescription === tariffData.brief_description && (
                  <p className="text-xs text-blue-600 mt-1">
                    <Info className="inline h-3 w-3 mr-1" />
                    Auto-populated from tariff data
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes or comments (optional)"
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
                  {tariffData?.quantity_1_code ? (
                    <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                      <span className="text-sm font-medium">{tariffData.quantity_1_code}</span>
                      <span className="text-xs text-gray-500 ml-1">(from tariff)</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="quantityUnit"
                      value={formData.quantityUnit}
                      onChange={handleInputChange}
                      placeholder="PCS, KG, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Weight className="inline h-4 w-4 mr-1" />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weightKg"
                    value={formData.weightKg}
                    onChange={handleInputChange}
                    placeholder="0.000"
                    step="0.001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

              {/* Info box about units */}
              {tariffData?.quantity_1_code && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Unit Information</p>
                      <p className="text-xs mt-1">
                        The quantity unit has been automatically set to <strong>{tariffData.quantity_1_code}</strong> based on the tariff schedule for HS code {formData.hsCode}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                disabled={loading || !formData.hsCode || !formData.productDescription}
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
