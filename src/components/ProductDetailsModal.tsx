import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TariffInfo from "@/components/TariffInfo";
import HSCodeSubtree from "@/components/HSCodeSubtree";
import { ClassificationRecord, updateClassification } from "@/lib/supabaseService";
import { useToast } from "@/hooks/use-toast";
import CustomButton from "@/components/ui/CustomButton";
import { Edit2, Save, X, Calendar, Package, DollarSign, Globe, Calculator } from "lucide-react";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: string;
  hsCode: string;
  confidence: number;
  classificationData?: ClassificationRecord; // Optional full classification record for editing
  onDataUpdated?: () => void; // Callback when data is updated
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  hsCode,
  confidence,
  classificationData,
  onDataUpdated
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ClassificationRecord>>(classificationData || {});
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditedData(classificationData || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData(classificationData || {});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!classificationData?.id) return;

    setSaving(true);
    try {
      await updateClassification(classificationData.id, editedData);
      toast({
        title: "Success",
        description: "Classification data updated successfully",
      });
      setIsEditing(false);
      onDataUpdated?.();
    } catch (error) {
      console.error('Error updating classification:', error);
      toast({
        title: "Error",
        description: "Failed to update classification data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCalculateTariff = () => {
    // Navigate to tariff calculator with pre-populated data
    navigate('/tariff-calculator', {
      state: {
        initialHsCode: hsCode,
        initialClassificationData: classificationData
      }
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">HS Code Details: {hsCode}</DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Product: {product}
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              {confidence}% confidence
            </span>
          </DialogDescription>
        </DialogHeader>
        
        {/* Editable Classification Data Section */}
        {classificationData && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">Saved Classification Data</h3>
              </div>
              <div className="flex gap-2">
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateTariff}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  Calculate Tariff
                </CustomButton>
                {isEditing ? (
                  <>
                    <CustomButton
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </CustomButton>
                    <CustomButton
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </CustomButton>
                  </>
                ) : (
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </CustomButton>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-800 border-b border-blue-200 pb-1">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                  {isEditing ? (
                    <textarea
                      value={editedData.product_description || ''}
                      onChange={(e) => handleInputChange('product_description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{classificationData.product_description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  {isEditing ? (
                    <textarea
                      value={editedData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{classificationData.notes || 'No notes'}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Classified: {formatDate(classificationData.classification_date)}</span>
                  </div>
                </div>
              </div>

              {/* Trade Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-800 border-b border-blue-200 pb-1">Trade Information</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin Country</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.origin_country || ''}
                        onChange={(e) => handleInputChange('origin_country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Country code"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {classificationData.origin_country || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typical Value</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedData.typical_value || ''}
                        onChange={(e) => handleInputChange('typical_value', parseFloat(e.target.value) || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="USD"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {classificationData.typical_value ? `$${classificationData.typical_value.toLocaleString()}` : 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedData.typical_quantity || ''}
                        onChange={(e) => handleInputChange('typical_quantity', parseFloat(e.target.value) || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{classificationData.typical_quantity || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.quantity_unit || ''}
                        onChange={(e) => handleInputChange('quantity_unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{classificationData.quantity_unit || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedData.weight_kg || ''}
                        onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        step="0.001"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{classificationData.weight_kg || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incoterms</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.incoterms || ''}
                        onChange={(e) => handleInputChange('incoterms', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{classificationData.incoterms || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Import Frequency</label>
                    {isEditing ? (
                      <select
                        value={editedData.import_frequency || ''}
                        onChange={(e) => handleInputChange('import_frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{classificationData.import_frequency || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="tariff" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="tariff">Tariff Information</TabsTrigger>
            <TabsTrigger value="validate">Validate Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tariff" className="mt-0">
            <TariffInfo hsCode={hsCode} />
          </TabsContent>
          
          <TabsContent value="validate" className="mt-0">
            <HSCodeSubtree hsCode={hsCode} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
