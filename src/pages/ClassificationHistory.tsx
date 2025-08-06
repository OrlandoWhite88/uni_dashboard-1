import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getUserClassifications, ClassificationRecord } from '@/lib/supabaseService';
import {
  Calendar,
  Package,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  Clock,
  User,
  FileText,
  Tag
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import NavigationSidebar from '@/components/NavigationSidebar/NavigationSidebar';
import { Input } from "@/components/ui/input";

const ClassificationHistory = () => {
  const { userId } = useAuth();
  const [classifications, setClassifications] = useState<ClassificationRecord[]>([]);
  const [filteredClassifications, setFilteredClassifications] = useState<ClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'product' | 'hs_code' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal state
  const [selectedClassification, setSelectedClassification] = useState<ClassificationRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadClassifications();
    }
  }, [userId]);

  useEffect(() => {
    // Filter classifications based on search term
    const filtered = classifications.filter(classification => 
      classification.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classification.hs_code.includes(searchTerm) ||
      (classification.supplier_info && classification.supplier_info.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Sort filtered classifications
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.classification_date || '');
          bValue = new Date(b.classification_date || '');
          break;
        case 'product':
          aValue = a.product_description.toLowerCase();
          bValue = b.product_description.toLowerCase();
          break;
        case 'hs_code':
          aValue = a.hs_code;
          bValue = b.hs_code;
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredClassifications(sorted);
  }, [classifications, searchTerm, sortBy, sortOrder]);

  const loadClassifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const userClassifications = await getUserClassifications(userId); // Get all classifications
      setClassifications(userClassifications);
    } catch (error) {
      console.error('Error loading classifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClassificationClick = (classification: ClassificationRecord) => {
    setSelectedClassification(classification);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClassification(null);
  };

  const handleDataUpdated = () => {
    // Refresh the classifications when data is updated
    loadClassifications();
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return <AlertTriangle className="h-3 w-3" />;
    if (confidence >= 90) return <CheckCircle className="h-3 w-3" />;
    if (confidence >= 70) return <Clock className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <NavigationSidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Classification History</h1>
              <p className="text-gray-600">
                View and manage all your product classifications
              </p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by product, HS code, or supplier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <div className="flex gap-1">
                    {[
                      { key: 'date', label: 'Date', icon: Calendar },
                      { key: 'product', label: 'Product', icon: Package },
                      { key: 'hs_code', label: 'HS Code', icon: Tag },
                      { key: 'confidence', label: 'Confidence', icon: CheckCircle }
                    ].map(({ key, label, icon: Icon }) => (
                      <CustomButton
                        key={key}
                        variant={sortBy === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSort(key as typeof sortBy)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                        {sortBy === key && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </CustomButton>
                    ))}
                  </div>
                  
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={loadClassifications}
                    disabled={loading}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </CustomButton>
                </div>
              </div>
              
              {/* Stats */}
              <div className="mt-4 pt-4 border-t flex gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{filteredClassifications.length} classifications</span>
                </div>
                {searchTerm && (
                  <div className="flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    <span>Filtered from {classifications.length} total</span>
                  </div>
                )}
              </div>
            </div>

            {/* Classifications List */}
            <div className="bg-white rounded-lg shadow-sm border">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Loading classifications...</p>
                </div>
              ) : filteredClassifications.length === 0 ? (
                <div className="p-8 text-center">
                  {searchTerm ? (
                    <>
                      <Search className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">No classifications found</p>
                      <p className="text-sm text-gray-400">
                        Try adjusting your search term or filters
                      </p>
                    </>
                  ) : (
                    <>
                      <Package className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">No classifications yet</p>
                      <p className="text-sm text-gray-400">
                        Start classifying products to see your history here
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredClassifications.map((classification) => (
                    <div
                      key={classification.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleClassificationClick(classification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 mb-1 truncate">
                                {classification.product_description}
                              </h3>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(classification.classification_date!)}
                                </div>
                                
                                {classification.supplier_info && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">
                                      {classification.supplier_info}
                                    </span>
                                  </div>
                                )}
                                
                                {classification.product_tags && classification.product_tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    <span className="truncate">
                                      {classification.product_tags.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {classification.notes && (
                                <div className="flex items-start gap-1 text-sm text-gray-600 mt-1">
                                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <p className="line-clamp-2">{classification.notes}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <div className="font-mono text-sm font-medium text-primary">
                                  {classification.hs_code}
                                </div>
                                {classification.confidence && (
                                  <div className={`flex items-center gap-1 justify-end mt-1 ${getConfidenceColor(classification.confidence)}`}>
                                    {getConfidenceIcon(classification.confidence)}
                                    <span className="text-xs">
                                      {Math.round(classification.confidence)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedClassification && (
        <ProductDetailsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          product={selectedClassification.product_description}
          hsCode={selectedClassification.hs_code}
          confidence={Math.round(selectedClassification.confidence || 0)}
          classificationData={selectedClassification}
          onDataUpdated={handleDataUpdated}
        />
      )}
    </div>
  );
};

export default ClassificationHistory;