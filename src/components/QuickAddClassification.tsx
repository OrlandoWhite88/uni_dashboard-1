import React, { useState, useEffect } from 'react';
import { X, Plus, Package, Globe, DollarSign, Weight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
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

const QuickAddClassification: React.FC<QuickAddClassificationProps> = ({
  userId,
  userEmail,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingTariff, setFetchingTariff] = useState(false);
  
  const [formData, setFormData] = useState({
    hsCode: '',
    productDescription: '',
    notes: '',
    originCountry: '',
    typicalValue: '',
    typicalQuantity: '',
    quantityUnit: '',
    weightKg: '',
    importFrequency: 'monthly',
    annualImportValue: '',
  });

  const [tariffData, setTariffData] = useState<any>(null);

  // Auto-detect quantity unit from tariff data
  useEffect(() => {
    if (tariffData?.quantity_1_code && !formData.quantityUnit) {
      setFormData(prev => ({
        ...prev,
        quantityUnit: tariffData.quantity_1_code
      }));
    }
  }, [tariffData, formData.quantityUnit]);

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
      setFormData(prev => ({
        ...prev,
        productDescription: data?.brief_description || prev.productDescription,
        quantityUnit: data?.quantity_1_code || prev.quantityUnit
      }));
    } catch (error) {
      console.error('Error fetching tariff data:', error);
    } finally {
      setFetchingTariff(false);
    }
  };

  // Check if weight is required based on tariff data
  const isWeightRequired = (): boolean => {
    if (!tariffData) return false;
    return tariffData.quantity_1_code === 'KG' || 
           (tariffData.mfn_text_rate && tariffData.mfn_text_rate.toString().toLowerCase().includes('kg'));
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

    if (isWeightRequired() && !formData.weightKg) {
      toast({
        title: "Validation Error",
        description: "Weight is required for this HS code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create classification record with enhanced fields
      const classification: ClassificationRecord & any = {
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add Product to History</h2>
              <p className="text-gray-600 mt-1">Manually add a product with its HS code and details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* HS Code Section */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fetchingTariff && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Tariff Data Display */}
              {tariffData && (
                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800 mb-2">Tariff Information Found</h4>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-green-700">
                              <strong>MFN Rate:</strong> {tariffData.mfn_text_rate || 'Free'}
                            </p>
                            {tariffData.quantity_1_code && (
                              <p className="text-green-700">
                                <strong>Unit:</strong> {tariffData.quantity_1_code}
                              </p>
                            )}
                          </div>
                          <div>
                            {tariffData.col1_special_text && (
                              <p className="text-green-700">
                                <strong>Special Programs:</strong> {tariffData.col1_special_text}
                              </p>
                            )}
                          </div>
                        </div>
                        {tariffData.brief_description && (
                          <p className="text-green-700 mt-2">
                            <strong>Description:</strong> {tariffData.brief_description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Description */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Trade Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="inline h-4 w-4 mr-1" />
                  Country of Origin
                </label>
                <select
                  name="originCountry"
                  value={formData.originCountry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quantity and Weight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                  {tariffData?.quantity_1_code && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                      Auto-detected: {tariffData.quantity_1_code}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="quantityUnit"
                  value={formData.quantityUnit}
                  onChange={handleInputChange}
                  placeholder="e.g., PCS, KG, L"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly={!!tariffData?.quantity_1_code}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Weight className="inline h-4 w-4 mr-1" />
                  Weight (kg)
                  {isWeightRequired() && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                      Required
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  name="weightKg"
                  value={formData.weightKg}
                  onChange={handleInputChange}
                  placeholder="0.000"
                  step="0.001"
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isWeightRequired() 
                      ? 'border-yellow-300 bg-yellow-50' 
                      : 'border-gray-300'
                  }`}
                />
                {isWeightRequired() && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Weight is required for this HS code due to weight-based duty rates
                  </p>
                )}
              </div>
            </div>

            {/* Import Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Frequency
                </label>
                <select
                  name="importFrequency"
                  value={formData.importFrequency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannual">Twice a Year</option>
                  <option value="annual">Annually</option>
                  <option value="occasional">Occasional</option>
                </select>
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
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
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
                disabled={loading || !formData.hsCode || !formData.productDescription || (isWeightRequired() && !formData.weightKg)}
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
