import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Layout from '@/components/Layout';
import { getUserClassifications, deleteClassification, toggleClassificationFavorite, searchClassifications, ClassificationRecord } from '@/lib/supabaseService';
import TariffInfo from '@/components/TariffInfo';
import { 
  Search, 
  Calendar, 
  Package, 
  Star, 
  Trash2, 
  Filter,
  AlertCircle,
  Loader2,
  Heart,
  Copy,
  X,
  Info,
  Clock,
  RefreshCw,
  Database,
  Calculator
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';

const ClassificationHistory = () => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<ClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'current' | 'needs_review' | 'changed'>('all');
  const [selectedClassification, setSelectedClassification] = useState<ClassificationRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadClassifications();
    }
  }, [userId]);

  const loadClassifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = await getUserClassifications(userId);
      setClassifications(data);
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

  const handleSearch = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = searchTerm 
        ? await searchClassifications(userId, searchTerm)
        : await getUserClassifications(userId);
      setClassifications(data);
    } catch (error) {
      console.error('Error searching classifications:', error);
      toast({
        title: "Error",
        description: "Failed to search classifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classification?')) return;
    
    try {
      const success = await deleteClassification(id);
      if (success) {
        setClassifications(prev => prev.filter(c => c.id !== id));
        toast({
          title: "Success",
          description: "Classification deleted successfully",
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting classification:', error);
      toast({
        title: "Error",
        description: "Failed to delete classification",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const updated = await toggleClassificationFavorite(id, !currentFavorite);
      if (updated) {
        setClassifications(prev => 
          prev.map(c => c.id === id ? { ...c, is_favorite: !currentFavorite } : c)
        );
        toast({
          title: "Success",
          description: `Classification ${!currentFavorite ? 'added to' : 'removed from'} favorites`,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const filteredClassifications = classifications.filter(c => {
    // Search filter
    const matchesSearch = c.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.hs_code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Filter by favorites
    if (showFavoritesOnly && !c.is_favorite) return false;
    
    // Filter by status
    if (statusFilter !== 'all') {
      const needsReview = c.needs_review || new Date(c.classification_date!) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      
      switch (statusFilter) {
        case 'current':
          return !needsReview && c.status !== 'changed';
        case 'needs_review':
          return needsReview;
        case 'changed':
          return c.status === 'changed';
        default:
          return true;
      }
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!userId) {
    return (
      <Layout className="pt-28 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view your classification history.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Classification History</h1>
          <p className="text-gray-600">
            View and manage your past HS code classifications
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-800">Total Classifications</h3>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {classifications.length}
            </div>
            <p className="text-sm text-blue-600">
              All time classifications
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium text-purple-800">Needs Review</h3>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {classifications.filter(c => c.needs_review || new Date(c.classification_date!) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-sm text-purple-600">
              Older than 6 months
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-green-800">Last Updated</h3>
            </div>
            <div className="text-xl font-bold text-green-900">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <p className="text-sm text-green-600">
              HTS Revision: 2024
            </p>
          </div>
        </div>

        {/* HTS/Tariff Status Widget */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm text-blue-800">HTS Revision: 2024</div>
                  <div className="text-xs text-blue-600">Current tariff schedule</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-sm text-green-800">Last Updated: {new Date().toLocaleDateString()}</div>
                  <div className="text-xs text-green-600">Tariff data synchronized</div>
                </div>
              </div>
              {classifications.some(c => c.needs_review) && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-sm text-yellow-800">
                      {classifications.filter(c => c.needs_review).length} Need Review
                    </div>
                    <div className="text-xs text-yellow-600">Classifications may be outdated</div>
                  </div>
                </div>
              )}
            </div>
            <CustomButton
              variant="outline"
              size="sm"
              onClick={loadClassifications}
              className="flex items-center text-xs"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </CustomButton>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product description, HS code, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <CustomButton onClick={handleSearch} className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Search
            </CustomButton>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Star className="h-4 w-4" />
              <span className="text-sm">Favorites only</span>
            </label>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="all">All Status</option>
                <option value="current">Current</option>
                <option value="needs_review">Needs Review</option>
                <option value="changed">Changed</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              {filteredClassifications.length} classification{filteredClassifications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Main Content Area with Sidebar */}
        <div className="relative">
          {/* Classifications Table */}
          {loading ? (
            <div className="bg-white border border-gray-200 p-8 rounded-lg text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading your classifications...</p>
            </div>
          ) : filteredClassifications.length === 0 ? (
            <div className="bg-white border border-gray-200 p-8 rounded-lg text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || showFavoritesOnly ? 'No matching classifications found' : 'No classifications yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || showFavoritesOnly 
                  ? 'Try adjusting your search or filters'
                  : 'Start classifying products to build your history'
                }
              </p>
              {!searchTerm && !showFavoritesOnly && (
                <CustomButton onClick={() => window.location.href = '/'}>
                  Start Classifying
                </CustomButton>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HS Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calculate Tariff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClassifications.map((classification) => (
                    <tr 
                      key={classification.id} 
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedClassification?.id === classification.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedClassification(classification);
                        setSidebarOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate max-w-xs">
                              {classification.product_description}
                            </div>
                            {classification.notes && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {classification.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {classification.is_favorite && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            {/* Status indicator dot */}
                            <div className={`w-2 h-2 rounded-full ${
                              classification.needs_review || new Date(classification.classification_date!) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                                ? 'bg-yellow-500' 
                                : classification.status === 'changed'
                                ? 'bg-red-500'
                                : 'bg-green-500'
                            }`} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600">
                            {classification.hs_code}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(classification.hs_code, 'HS Code');
                            }}
                            className="opacity-60 hover:opacity-100 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(classification.classification_date!)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/tariff-calculator?hsCode=${encodeURIComponent(classification.hs_code)}`;
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                        >
                          <Calculator className="h-3 w-3" />
                          Calculate
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(classification.id!, classification.is_favorite || false);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Heart className={`h-4 w-4 ${classification.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClassification(classification);
                              setSidebarOpen(true);
                            }}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(classification.id!);
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Right Sidebar */}
          {sidebarOpen && selectedClassification && (
            <div className="fixed inset-y-0 right-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/3 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
              <div className="p-6">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Classification Details</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Product Information */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Description</label>
                    <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                      {selectedClassification.product_description}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">HS Code</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-mono font-bold text-blue-600">
                        {selectedClassification.hs_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedClassification.hs_code, 'HS Code')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-sm mt-1">
                        {formatDate(selectedClassification.classification_date!)}
                      </p>
                    </div>
                    {selectedClassification.confidence && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Confidence</label>
                        <p className="text-sm mt-1">
                          {Math.round(selectedClassification.confidence)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedClassification.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                        {selectedClassification.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tariff Information */}
                <div>
                  <h4 className="font-medium mb-3">Tariff Information</h4>
                  <TariffInfo hsCode={selectedClassification.hs_code} />
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClassificationHistory;
