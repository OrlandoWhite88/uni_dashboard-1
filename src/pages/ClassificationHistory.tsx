import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { 
  getUserClassifications, 
  deleteClassification, 
  toggleClassificationFavorite,
  searchClassifications,
  ClassificationRecord 
} from '@/lib/supabaseService';
import { 
  Search, 
  Trash2, 
  Star, 
  Package, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';
import QuickAddClassification from '@/components/QuickAddClassification';
import ProductDetailsModal from '@/components/ProductDetailsModal';

const ClassificationHistory = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<ClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<ClassificationRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);

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
      if (searchTerm.trim()) {
        const results = await searchClassifications(userId, searchTerm);
        setClassifications(results);
      } else {
        await loadClassifications();
      }
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

  const handleToggleFavorite = async (classification: ClassificationRecord) => {
    if (!classification.id) return;
    
    try {
      const updated = await toggleClassificationFavorite(
        classification.id, 
        !classification.is_favorite
      );
      
      if (updated) {
        setClassifications(prev => 
          prev.map(c => c.id === classification.id 
            ? { ...c, is_favorite: !c.is_favorite }
            : c
          )
        );
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['HS Code', 'Product Description', 'Classification Date', 'Confidence', 'Notes'];
    const rows = classifications.map(c => [
      c.hs_code,
      c.product_description,
      formatDate(c.classification_date),
      c.confidence ? `${Math.round(c.confidence)}%` : 'N/A',
      c.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classifications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredClassifications = filterFavorites 
    ? classifications.filter(c => c.is_favorite)
    : classifications;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Classification History</h1>
          <p className="text-muted-foreground">
            View and manage your product classification history
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by HS code or product description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <CustomButton onClick={handleSearch} variant="outline">
                Search
              </CustomButton>
            </div>
            
            <div className="flex gap-2">
              <CustomButton
                onClick={() => setFilterFavorites(!filterFavorites)}
                variant={filterFavorites ? "default" : "outline"}
                size="sm"
              >
                <Star className="h-4 w-4 mr-1" />
                Favorites
              </CustomButton>
              
              <CustomButton
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                disabled={classifications.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </CustomButton>
              
              <CustomButton
                onClick={() => setShowAddModal(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </CustomButton>
            </div>
          </div>
        </div>

        {/* Classifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading classifications...</p>
          </div>
        ) : filteredClassifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Classifications Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "No classifications match your search criteria"
                : filterFavorites
                  ? "You haven't marked any classifications as favorites yet"
                  : "You haven't classified any products yet"
              }
            </p>
            {!searchTerm && !filterFavorites && (
              <CustomButton onClick={() => navigate('/classify')}>
                Classify Your First Product
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClassifications.map((classification) => (
              <div
                key={classification.id}
                className="glass-card p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedClassification(classification);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg truncate">
                        {classification.product_description}
                      </h3>
                      {classification.is_favorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span className="font-mono font-medium text-primary">
                          {classification.hs_code}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(classification.classification_date)}</span>
                      </div>
                      
                      {classification.confidence && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{Math.round(classification.confidence)}% confidence</span>
                        </div>
                      )}
                      
                      {classification.origin_country && (
                        <div className="flex items-center gap-1">
                          <span>Origin: {classification.origin_country}</span>
                        </div>
                      )}
                    </div>
                    
                    {classification.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {classification.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <CustomButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(classification);
                      }}
                    >
                      <Star className={`h-4 w-4 ${classification.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </CustomButton>
                    
                    <CustomButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClassification(classification);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </CustomButton>
                    
                    <CustomButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (classification.id) handleDelete(classification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </CustomButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Add Modal */}
        {showAddModal && userId && (
          <QuickAddClassification
            userId={userId}
            userEmail={undefined}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              loadClassifications();
            }}
          />
        )}

        {/* Product Details Modal */}
        <ProductDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedClassification(null);
          }}
          classification={selectedClassification}
          onUpdate={loadClassifications}
        />
      </div>
    </Layout>
  );
};

export default ClassificationHistory;
