import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import Layout from "@/components/Layout";
import { getUserProductClassifications, deleteProductClassification, ProductClassification } from "@/lib/supabaseService";
import { 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  ArrowUpDown, 
  Loader2, 
  AlertCircle, 
  FileText, 
  Star
} from "lucide-react";
import CustomButton from "@/components/ui/CustomButton";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MyClassifications = () => {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for classifications
  const [classifications, setClassifications] = useState<ProductClassification[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<ProductClassification | null>(null);
  
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("classification_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  
  // Fetch classifications on component mount and when filters change
  useEffect(() => {
    const fetchClassifications = async () => {
      if (!isLoaded || !isSignedIn || !userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        
        const { data, count } = await getUserProductClassifications(userId, {
          limit: itemsPerPage,
          offset,
          sortBy,
          sortOrder,
          searchTerm: searchTerm.trim() || undefined
        });
        
        setClassifications(data);
        setTotalCount(count);
      } catch (err) {
        console.error("Error fetching classifications:", err);
        setError("Failed to load your classifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassifications();
  }, [userId, isLoaded, isSignedIn, currentPage, itemsPerPage, sortBy, sortOrder, searchTerm]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to descending
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page when sort changes
  };
  
  // Handle delete classification
  const handleDeleteClassification = async (id: string) => {
    if (!userId || !id) return;
    
    if (window.confirm("Are you sure you want to delete this classification?")) {
      try {
        const success = await deleteProductClassification(userId, id);
        
        if (success) {
          // Remove from state
          setClassifications(prev => prev.filter(c => c.id !== id));
          setTotalCount(prev => prev - 1);
          
          toast({
            title: "Classification deleted",
            description: "The classification has been removed",
            variant: "default"
          });
        } else {
          setError("Failed to delete classification. Please try again.");
        }
      } catch (err) {
        console.error("Error deleting classification:", err);
        setError("An error occurred while deleting the classification.");
      }
    }
  };
  
  // Handle view classification details
  const handleViewClassification = (classification: ProductClassification) => {
    setSelectedClassification(classification);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {classifications.length} of {totalCount} results
        </div>
        <div className="flex items-center space-x-2">
          <CustomButton
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </CustomButton>
          
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          
          <CustomButton
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </CustomButton>
        </div>
      </div>
    );
  };
  
  // Format confidence as percentage
  const formatConfidence = (confidence: number | undefined) => {
    if (confidence === undefined) return "N/A";
    return `${confidence.toFixed(1)}%`;
  };
  
  // Format date as relative time
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return "Invalid date";
    }
  };
  
  // Truncate long text
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            My Classifications
          </h1>
          <p className="text-muted-foreground">
            View and manage your saved product classifications.
          </p>
        </div>
        
        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product description or HS code..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="flex gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => handleSortChange("classification_date")}
              className="flex items-center whitespace-nowrap"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Date
              {sortBy === "classification_date" && (
                <ArrowUpDown className="h-3 w-3 ml-1" />
              )}
            </CustomButton>
            
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => handleSortChange("confidence")}
              className="flex items-center whitespace-nowrap"
            >
              <Star className="h-4 w-4 mr-1" />
              Confidence
              {sortBy === "confidence" && (
                <ArrowUpDown className="h-3 w-3 ml-1" />
              )}
            </CustomButton>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Loading your classifications...</span>
          </div>
        ) : classifications.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No classifications found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "No results match your search criteria. Try different keywords."
                : "You haven't saved any product classifications yet."}
            </p>
            <CustomButton onClick={() => navigate("/")}>
              Classify a Product
            </CustomButton>
          </div>
        ) : (
          <>
            {/* Classifications list */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr,120px,100px,120px] bg-muted/40 px-4 py-3 border-b border-border text-sm font-medium text-muted-foreground">
                <div>Product</div>
                <div>HS Code</div>
                <div>Confidence</div>
                <div className="text-right">Actions</div>
              </div>
              
              <div className="divide-y divide-border">
                {classifications.map((classification) => (
                  <div 
                    key={classification.id} 
                    className="grid grid-cols-[1fr,120px,100px,120px] px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">
                        {truncateText(classification.product_description, 60)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(classification.classification_date)}
                      </span>
                    </div>
                    
                    <div className="font-mono text-sm">
                      {classification.hs_code}
                    </div>
                    
                    <div>
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        (classification.confidence || 0) > 90 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                          : (classification.confidence || 0) > 75
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {formatConfidence(classification.confidence)}
                      </span>
                    </div>
                    
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={() => handleViewClassification(classification)}
                        className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClassification(classification.id!)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete classification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Pagination */}
            {renderPagination()}
          </>
        )}
        
        {/* Classification details modal */}
        {selectedClassification && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-auto animate-in fade-in zoom-in-95">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Classification Details</h3>
                <button
                  onClick={() => setSelectedClassification(null)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Product Description</div>
                  <p className="text-lg">{selectedClassification.product_description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">HS Code</div>
                    <div className="text-2xl font-bold font-mono">{selectedClassification.hs_code}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Confidence</div>
                    <div className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium",
                      (selectedClassification.confidence || 0) > 90 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : (selectedClassification.confidence || 0) > 75
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {formatConfidence(selectedClassification.confidence)}
                    </div>
                  </div>
                </div>
                
                {selectedClassification.full_path && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Classification Path</div>
                    <p className="p-3 bg-muted/30 rounded-md text-sm">{selectedClassification.full_path}</p>
                  </div>
                )}
                
                <div className="mb-6">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Classification Date</div>
                  <p>{selectedClassification.classification_date ? new Date(selectedClassification.classification_date).toLocaleString() : "Unknown"}</p>
                </div>
                
                {selectedClassification.tariff_data && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Tariff Information</div>
                    <div className="p-3 bg-muted/30 rounded-md">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedClassification.tariff_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end">
                <CustomButton
                  variant="outline"
                  onClick={() => setSelectedClassification(null)}
                >
                  Close
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyClassifications;