import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Layout from '@/components/Layout';
import { getUserClassifications, deleteClassification, toggleClassificationFavorite, searchClassifications, ClassificationRecord } from '@/lib/supabaseService';
import { getTariffInfo } from '@/lib/classifierService';
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
  CheckCircle
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';

const ClassificationHistory = () => {
  const { userId, user } = useAuth();
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<ClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loadingTariff, setLoadingTariff] = useState<string | null>(null);
  const [tariffData, setTariffData] = useState<Record<string, any>>({});

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

  const loadTariffData = async (hsCode: string, classificationId: string) => {
    if (tariffData[classificationId]) return; // Already loaded
    
    setLoadingTariff(classificationId);
    try {
      const data = await getTariffInfo(hsCode);
      setTariffData(prev => ({ ...prev, [classificationId]: data }));
    } catch (error) {
      console.error('Error loading tariff data:', error);
      toast({
        title: "Error",
        description: "Failed to load tariff information",
        variant: "destructive",
      });
    } finally {
      setLoadingTariff(null);
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

        {/* Classifications List */}
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
          <div className="space-y-4">
            {filteredClassifications.map((classification) => (
              <div key={classification.id} className="glass-card rounded-xl overflow-hidden">
                {/* Card Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{classification.product_description}</h3>
                        {classification.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(classification.classification_date!)}
                        </div>
                        {classification.confidence && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {Math.round(classification.confidence)}% confidence
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-mono font-bold text-primary">
                          {classification.hs_code}
                        </span>
                        <CustomButton
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(classification.hs_code, 'HS Code')}
                        >
                          <Copy className="h-4 w-4" />
                        </CustomButton>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CustomButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(classification.id!, classification.is_favorite || false)}
                      >
                        <Heart className={`h-4 w-4 ${classification.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                      </CustomButton>
                      
                      <CustomButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCard(
                          expandedCard === classification.id ? null : classification.id!
                        )}
                      >
                        {expandedCard === classification.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CustomButton>
                      
                      <CustomButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(classification.id!)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </CustomButton>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCard === classification.id && (
                  <div className="p-6 bg-secondary/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Classification Details */}
                      <div>
                        <h4 className="font-medium mb-3">Classification Details</h4>
                        
                        {classification.full_path && (
                          <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground">Classification Path</label>
                            <p className="text-sm mt-1 font-mono bg-background p-2 rounded border">
                              {classification.full_path}
                            </p>
                          </div>
                        )}

                        {classification.notes && (
                          <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <p className="text-sm mt-1 bg-background p-2 rounded border">
                              {classification.notes}
                            </p>
                          </div>
                        )}

                        <CustomButton
                          variant="outline"
                          size="sm"
                          onClick={() => loadTariffData(classification.hs_code, classification.id!)}
                          disabled={loadingTariff === classification.id}
                        >
                          {loadingTariff === classification.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Load Tariff Info
                        </CustomButton>
                      </div>

                      {/* Tariff Information */}
                      <div>
                        <h4 className="font-medium mb-3">Tariff Information</h4>
                        
                        {tariffData[classification.id!] ? (
                          <div className="space-y-3">
                            {Object.entries(tariffData[classification.id!]).map(([key, value]) => (
                              <div key={key}>
                                <label className="text-sm font-medium text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}
                                </label>
                                <p className="text-sm mt-1 bg-background p-2 rounded border">
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Click "Load Tariff Info" to view detailed tariff information for this HS code.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassificationHistory;