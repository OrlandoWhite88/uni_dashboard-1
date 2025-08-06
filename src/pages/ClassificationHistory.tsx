import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Package, 
  Globe, 
  DollarSign, 
  Weight, 
  Calculator,
  Eye,
  Edit,
  Trash2,
  Download,
  Tag,
  Building,
  FileText,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { getUserClassifications, ClassificationRecord, deleteClassification } from '@/lib/supabaseService';
import { useToast } from '@/hooks/use-toast';
import CustomButton from '@/components/ui/CustomButton';
import QuickAddClassification from '@/components/QuickAddClassification';

interface ClassificationHistoryProps {}

interface EnhancedClassificationRecord extends ClassificationRecord {
  origin_country?: string;
  typical_value?: number;
  typical_quantity?: number;
  quantity_unit?: string;
  weight_kg?: number;
  supplier_info?: {
    name?: string;
    country?: string;
    contact?: string;
  };
  incoterms?: string;
  product_tags?: string[];
  fta_certificates?: {
    certificates?: string[];
    lastUpdated?: string;
  };
  import_frequency?: string;
  annual_import_value?: number;
  is_manual_entry?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ClassificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classification: EnhancedClassificationRecord | null;
  onCalculate: (classification: EnhancedClassificationRecord) => void;
  onEdit: (classification: EnhancedClassificationRecord) => void;
  onDelete: (id: string) => void;
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "CN", name: "China" },
  { code: "DE", name: "Germany" },
  { code: "JP", name: "Japan" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "KR", name: "South Korea" },
  // Add more countries as needed
];

const getCountryName = (code: string): string => {
  const country = COUNTRIES.find(c => c.code === code);
  return country ? country.name : code;
};

const ClassificationDetailsModal: React.FC<ClassificationDetailsModalProps> = ({
  isOpen,
  onClose,
  classification,
  onCalculate,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !classification) return null;

  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Classification Details</h2>
              <p className="text-gray-600 mt-1">HS Code: {classification.hs_code}</p>
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
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Product Description</label>
                  <p className="text-sm text-gray-900 mt-1">{classification.product_description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Classification Date</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(classification.created_at)}</p>
                </div>
                {classification.notes && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900 mt-1">{classification.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trade Information */}
            {(classification.origin_country || classification.typical_value || classification.typical_quantity) && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Trade Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classification.origin_country && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Country of Origin</label>
                      <p className="text-sm text-gray-900 mt-1">{getCountryName(classification.origin_country)}</p>
                    </div>
                  )}
                  {classification.typical_value && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Typical Value</label>
                      <p className="text-sm text-gray-900 mt-1">{formatCurrency(classification.typical_value)}</p>
                    </div>
                  )}
                  {classification.typical_quantity && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Typical Quantity</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {classification.typical_quantity} {classification.quantity_unit || 'units'}
                      </p>
                    </div>
                  )}
                  {classification.weight_kg && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Weight</label>
                      <p className="text-sm text-gray-900 mt-1">{classification.weight_kg} kg</p>
                    </div>
                  )}
                  {classification.incoterms && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Incoterms</label>
                      <p className="text-sm text-gray-900 mt-1">{classification.incoterms}</p>
                    </div>
                  )}
                  {classification.import_frequency && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Import Frequency</label>
                      <p className="text-sm text-gray-900 mt-1 capitalize">{classification.import_frequency}</p>
                    </div>
                  )}
                  {classification.annual_import_value && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Annual Import Value</label>
                      <p className="text-sm text-gray-900 mt-1">{formatCurrency(classification.annual_import_value)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Supplier Information */}
            {classification.supplier_info && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Supplier Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {classification.supplier_info.name && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Supplier Name</label>
                      <p className="text-sm text-gray-900 mt-1">{classification.supplier_info.name}</p>
                    </div>
                  )}
                  {classification.supplier_info.country && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Supplier Country</label>
                      <p className="text-sm text-gray-900 mt-1">{getCountryName(classification.supplier_info.country)}</p>
                    </div>
                  )}
                  {classification.supplier_info.contact && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Contact</label>
                      <p className="text-sm text-gray-900 mt-1">{classification.supplier_info.contact}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags and Certificates */}
            {(classification.product_tags?.length || classification.fta_certificates?.certificates?.length) && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags & Certificates
                </h3>
                <div className="space-y-3">
                  {classification.product_tags && classification.product_tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Product Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {classification.product_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {classification.fta_certificates?.certificates && classification.fta_certificates.certificates.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">FTA Certificates</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {classification.fta_certificates.certificates.map((cert, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tariff Information */}
            {classification.tariff_data && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Tariff Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">MFN Rate</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {classification.tariff_data.mfn_text_rate || 'Free'}
                    </p>
                  </div>
                  {classification.tariff_data.brief_description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tariff Description</label>
                      <p className="text-sm text-gray-900 mt-1">{classification.tariff_data.brief_description}</p>
                    </div>
                  )}
                  {classification.tariff_data.col1_special_text && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Special Programs</label>
                      <p className="text-sm text-gray-900 mt-1">{classification.tariff_data.col1_special_text}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {classification.is_manual_entry && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Manual Entry
                </span>
              )}
              <span>Last updated: {formatDate(classification.updated_at || classification.created_at)}</span>
            </div>
            <div className="flex gap-3">
              <CustomButton
                variant="outline"
                onClick={() => onEdit(classification)}
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </CustomButton>
              <CustomButton
                onClick={() => onCalculate(classification)}
                size="sm"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Duty
              </CustomButton>
              <CustomButton
                variant="outline"
                onClick={() => onDelete(classification.id)}
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClassificationHistory: React.FC<ClassificationHistoryProps> = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [classifications, setClassifications] = useState<EnhancedClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<EnhancedClassificationRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadClassifications();
    }
  }, [userId]);

  const loadClassifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = await getUserClassifications(userId, 100);
      setClassifications(data as EnhancedClassificationRecord[]);
    } catch (error) {
      console.error('Error loading classifications:', error);
      toast({
        title: "Error",
        description: "Failed to load classification history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (classification: EnhancedClassificationRecord) => {
    setSelectedClassification(classification);
    setShowDetailsModal(true);
  };

  const handleCalculate = (classification: EnhancedClassificationRecord) => {
    // Navigate to tariff calculator with pre-filled data
    const params = new URLSearchParams({
      hsCode: classification.hs_code,
      description: classification.product_description,
      ...(classification.origin_country && { originCountry: classification.origin_country }),
      ...(classification.typical_value && { invoiceValue: classification.typical_value.toString() }),
      ...(classification.typical_quantity && { quantity: classification.typical_quantity.toString() }),
      ...(classification.weight_kg && { weight: classification.weight_kg.toString() }),
    });
    
    navigate(`/tariff-calculator?${params.toString()}`);
    setShowDetailsModal(false);
  };

  const handleEdit = (classification: EnhancedClassificationRecord) => {
    // For now, just show a toast - editing functionality would need to be implemented
    toast({
      title: "Edit Feature",
      description: "Edit functionality will be available in a future update",
    });
    setShowDetailsModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classification?')) {
      return;
    }

    try {
      await deleteClassification(id);
      await loadClassifications();
      toast({
        title: "Success",
        description: "Classification deleted successfully",
      });
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error deleting classification:', error);
      toast({
        title: "Error",
        description: "Failed to delete classification",
        variant: "destructive",
      });
    }
  };

  // Filter classifications based on search term and tag
  const filteredClassifications = classifications.filter(classification => {
    const matchesSearch = !searchTerm || 
      classification.hs_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classification.product_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !filterTag || 
      (classification.product_tags && classification.product_tags.some(tag => 
        tag.toLowerCase().includes(filterTag.toLowerCase())
      ));
    
    return matchesSearch && matchesTag;
  });

  // Get all unique tags for filter dropdown
  const allTags = Array.from(new Set(
    classifications.flatMap(c => c.product_tags || [])
  )).sort();

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading classification history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classification History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your product classifications
          </p>
        </div>
        <CustomButton onClick={() => setShowQuickAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </CustomButton>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by HS code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {allTags.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="pl-10 pr-8 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none bg-background"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Classifications List */}
      {filteredClassifications.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No classifications found</h3>
          <p className="text-muted-foreground mb-4">
            {classifications.length === 0 
              ? "Start by adding your first product classification"
              : "Try adjusting your search or filter criteria"
            }
          </p>
          {classifications.length === 0 && (
            <CustomButton onClick={() => setShowQuickAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </CustomButton>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClassifications.map((classification) => (
            <div
              key={classification.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(classification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-mono font-semibold text-lg">{classification.hs_code}</h3>
                    {classification.is_manual_entry && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Manual
                      </span>
                    )}
                    {classification.product_tags && classification.product_tags.length > 0 && (
                      <div className="flex gap-1">
                        {classification.product_tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {classification.product_tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{classification.product_tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {classification.product_description}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {classification.origin_country && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{getCountryName(classification.origin_country)}</span>
                      </div>
                    )}
                    {classification.typical_value && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(classification.typical_value)}</span>
                      </div>
                    )}
                    {classification.typical_quantity && (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{classification.typical_quantity} {classification.quantity_unit || 'units'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(classification.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalculate(classification);
                    }}
                  >
                    <Calculator className="h-4 w-4" />
                  </CustomButton>
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(classification);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </CustomButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddClassification
          userId={userId!}
          userEmail={undefined}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => {
            setShowQuickAdd(false);
            loadClassifications();
          }}
        />
      )}

      {/* Classification Details Modal */}
      <ClassificationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        classification={selectedClassification}
        onCalculate={handleCalculate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ClassificationHistory;
