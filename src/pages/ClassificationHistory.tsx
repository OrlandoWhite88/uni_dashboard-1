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
  ExternalLink, 
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Heart,
  Copy,
  CheckCircle,
  X,
  Info
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

  const filteredClassifications = classifications.filter(c => 
    !showFavoritesOnly || c.is_favorite
  );

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
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-muted-foreground">
            Please sign in to view your classification history.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Classification History</h1>
          <p className="text-muted-foreground">
            View and manage your past HS code classifications
          </p>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-6 rounded-xl mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by product description, HS code, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="rounded border-border"
              />
              <Star className="h-4 w-4" />
              <span className="text-sm">Favorites only</span>
            </label>
            
            <div className="text-sm text-muted-foreground">
              {filteredClassifications.length} classification{filteredClassifications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Main Content Area with Sidebar */}
        <div className="relative">
          {/* Classifications Table */}
          {loading ? (
            <div className="glass-card p-8 rounded-xl text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading your classifications...</p>
            </div>
          ) : filteredClassifications.length === 0 ? (
            <div className="glass-card p-8 rounded-xl text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || showFavoritesOnly ? 'No matching classifications found' : 'No classifications yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
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
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Created</th>
                      <th className="text-left p-4 font-medium text-sm">Product</th>
                      <th className="text-left p-4 font-medium text-sm">Classification</th>
                      <th className="text-left p-4 font-medium text-sm">Confidence</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClassifications.map((classification, index) => (
                      <tr 
                        key={classification.id} 
                        className={`border-b border-border hover:bg-muted/20 cursor-pointer transition-colors ${
                          selectedClassification?.id === classification.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => {
                          setSelectedClassification(classification);
                          setSidebarOpen(true);
                        }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(classification.classification_date!)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-sm max-w-xs truncate">
                                {classification.product_description}
                              </div>
                              {classification.notes && (
                                <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                  {classification.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {classification.is_favorite && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                              {classification.needs_review && (
                                <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Review
                                </div>
                              )}
                              {classification.status === 'changed' && (
                                <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  Changed
                                </div>
                              )}
                              {classification.status === 'current' && !classification.needs_review && (
                                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Current
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">
                              {classification.hs_code}
                            </span>
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(classification.hs_code, 'HS Code');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </CustomButton>
                          </div>
                        </td>
                        <td className="p-4">
                          {classification.confidence && (
                            <div className="flex items-center gap-1 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {Math.round(classification.confidence)}%
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(classification.id!, classification.is_favorite || false);
                              }}
                            >
                              <Heart className={`h-4 w-4 ${classification.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                            </CustomButton>
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClassification(classification);
                                setSidebarOpen(true);
                              }}
                            >
                              <Info className="h-4 w-4" />
                            </CustomButton>
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(classification.id!);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </CustomButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Right Sidebar */}
          {sidebarOpen && selectedClassification && (
            <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-lg z-50 overflow-y-auto">
              <div className="p-6">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Classification Details</h3>
                  <CustomButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </CustomButton>
                </div>

                {/* Product Information */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Description</label>
                    <p className="text-sm mt-1 bg-muted/30 p-3 rounded-md">
                      {selectedClassification.product_description}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">HS Code</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-mono font-bold text-primary">
                        {selectedClassification.hs_code}
                      </span>
                      <CustomButton
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedClassification.hs_code, 'HS Code')}
                      >
                        <Copy className="h-4 w-4" />
                      </CustomButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-sm mt-1">
                        {formatDate(selectedClassification.classification_date!)}
                      </p>
                    </div>
                    {selectedClassification.confidence && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {Math.round(selectedClassification.confidence)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedClassification.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-sm mt-1 bg-muted/30 p-3 rounded-md">
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
