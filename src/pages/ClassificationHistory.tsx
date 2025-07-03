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
  Info,
  Clock,
  RefreshCw,
  Database,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type SortField = 'date' | 'product' | 'hs_code' | 'confidence';
type SortDirection = 'asc' | 'desc';

const ClassificationHistory = () => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<ClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'current' | 'needs_review' | 'changed'>('all');
  const [selectedClassification, setSelectedClassification] = useState<ClassificationRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
    try {
      const success = await deleteClassification(id);
      if (success) {
        setClassifications(prev => prev.filter(c => c.id !== id));
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredClassifications.map(c => c.id!)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSet = new Set(selectedItems);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedItems(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} classification${selectedItems.size > 1 ? 's' : ''}?`)) return;
    
    try {
      const promises = Array.from(selectedItems).map(id => deleteClassification(id));
      await Promise.all(promises);
      
      setClassifications(prev => prev.filter(c => !selectedItems.has(c.id!)));
      setSelectedItems(new Set());
      
      toast({
        title: "Success",
        description: `${selectedItems.size} classification${selectedItems.size > 1 ? 's' : ''} deleted successfully`,
      });
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast({
        title: "Error",
        description: "Failed to delete some classifications",
        variant: "destructive",
      });
    }
  };

  const filteredClassifications = classifications
    .filter(c => {
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
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.classification_date!);
          bValue = new Date(b.classification_date!);
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
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
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

  const getStatusBadge = (classification: ClassificationRecord) => {
    const needsReview = classification.needs_review || new Date(classification.classification_date!) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    
    if (classification.status === 'changed') {
      return <Badge variant="destructive" className="text-xs">Changed</Badge>;
    } else if (needsReview) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">Review</Badge>;
    } else {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">Current</Badge>;
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {children}
      <div className="flex flex-col">
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </div>
    </button>
  );

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Classification History</h1>
          <p className="text-muted-foreground">
            View and manage your past HS code classifications
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Total Classifications</h3>
                <p className="text-xs text-muted-foreground">All time classifications</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">
              {classifications.length}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-25 border-yellow-200 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Needs Review</h3>
                <p className="text-xs text-yellow-600">Older than 6 months</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-800">
              {classifications.filter(c => c.needs_review || new Date(c.classification_date!) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)).length}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-25 border-green-200 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Current</h3>
                <p className="text-xs text-green-600">Up to date classifications</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-800">
              {classifications.filter(c => !c.needs_review && new Date(c.classification_date!) >= new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) && c.status !== 'changed').length}
            </div>
          </div>
        </div>

        {/* HTS Status Widget */}
        <div className="glass-card p-4 rounded-xl mb-6 bg-blue-50/50 border-blue-200 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-800">HTS Revision: 2024</div>
                  <div className="text-sm text-blue-600">Current tariff schedule</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">Last Updated: {new Date().toLocaleDateString()}</div>
                  <div className="text-sm text-green-600">Tariff data synchronized</div>
                </div>
              </div>
            </div>
            <CustomButton
              variant="outline"
              size="sm"
              onClick={loadClassifications}
              className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </CustomButton>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-6 rounded-xl mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by product description, HS code, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <CustomButton onClick={handleSearch} className="flex items-center gap-2 px-6">
              <Search className="h-4 w-4" />
              Search
            </CustomButton>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
              <Checkbox
                checked={showFavoritesOnly}
                onCheckedChange={(checked) => setShowFavoritesOnly(checked === true)}
              />
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Favorites only</span>
            </label>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="all">All Status</option>
                <option value="current">Current</option>
                <option value="needs_review">Needs Review</option>
                <option value="changed">Changed</option>
              </select>
            </div>
            
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} selected
                </span>
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </CustomButton>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground ml-auto">
              {filteredClassifications.length} classification{filteredClassifications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Classifications Table */}
        {loading ? (
          <div className="glass-card p-12 rounded-xl text-center animate-scale-in">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your classifications...</p>
          </div>
        ) : filteredClassifications.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center animate-scale-in">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || showFavoritesOnly ? 'No matching classifications found' : 'No classifications yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || showFavoritesOnly 
                ? 'Try adjusting your search or filters'
                : 'Start classifying products to build your history'
              }
            </p>
            {!searchTerm && !showFavoritesOnly && (
              <CustomButton onClick={() => window.location.href = '/'} size="lg">
                Start Classifying
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size === filteredClassifications.length && filteredClassifications.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton field="date">Date</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="product">Product</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="hs_code">HS Code</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="confidence">Confidence</SortButton>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClassifications.map((classification, index) => (
                  <TableRow 
                    key={classification.id} 
                    className="group hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      setSelectedClassification(classification);
                      setSheetOpen(true);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.has(classification.id!)}
                        onCheckedChange={(checked) => handleSelectItem(classification.id!, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {formatDate(classification.classification_date!)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate mb-1">
                            {classification.product_description}
                          </div>
                          {classification.notes && (
                            <div className="text-xs text-muted-foreground truncate">
                              {classification.notes}
                            </div>
                          )}
                        </div>
                        {classification.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-lg">
                          {classification.hs_code}
                        </span>
                        <CustomButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(classification.hs_code, 'HS Code');
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="h-3 w-3" />
                        </CustomButton>
                      </div>
                    </TableCell>
                    <TableCell>
                      {classification.confidence && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                              style={{ width: `${classification.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-green-700">
                            {Math.round(classification.confidence)}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(classification)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <CustomButton
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </CustomButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClassification(classification);
                              setSheetOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleFavorite(classification.id!, classification.is_favorite || false)}
                          >
                            <Heart className={`h-4 w-4 mr-2 ${classification.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                            {classification.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(classification.hs_code, 'HS Code')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy HS Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(classification.id!)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Details Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Classification Details</SheetTitle>
              <SheetDescription>
                View detailed information about this classification
              </SheetDescription>
            </SheetHeader>
            
            {selectedClassification && (
              <div className="mt-6 space-y-6">
                {/* Product Information */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Product Description
                    </label>
                    <p className="text-sm mt-2 bg-muted/30 p-4 rounded-lg border">
                      {selectedClassification.product_description}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      HS Code
                    </label>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xl font-mono font-bold text-primary">
                        {selectedClassification.hs_code}
                      </span>
                      <CustomButton
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedClassification.hs_code, 'HS Code')}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </CustomButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Date
                      </label>
                      <p className="text-sm mt-2 font-medium">
                        {formatDate(selectedClassification.classification_date!)}
                      </p>
                    </div>
                    {selectedClassification.confidence && (
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Confidence
                        </label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-600"
                              style={{ width: `${selectedClassification.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-green-700">
                            {Math.round(selectedClassification.confidence)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedClassification.notes && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Notes
                      </label>
                      <p className="text-sm mt-2 bg-muted/30 p-4 rounded-lg border">
                        {selectedClassification.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </label>
                    <div className="mt-2">
                      {getStatusBadge(selectedClassification)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <CustomButton
                    variant="outline"
                    onClick={() => handleToggleFavorite(selectedClassification.id!, selectedClassification.is_favorite || false)}
                    className="flex items-center gap-2"
                  >
                    <Heart className={`h-4 w-4 ${selectedClassification.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                    {selectedClassification.is_favorite ? 'Remove Favorite' : 'Add Favorite'}
                  </CustomButton>
                  <CustomButton
                    variant="outline"
                    onClick={() => copyToClipboard(selectedClassification.hs_code, 'HS Code')}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </CustomButton>
                </div>

                {/* Tariff Information */}
                <div className="pt-6 border-t">
                  <h4 className="font-semibold mb-4 text-lg">Tariff Information</h4>
                  <TariffInfo hsCode={selectedClassification.hs_code} />
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
};

export default ClassificationHistory;
