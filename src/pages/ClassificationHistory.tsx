import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Layout from '@/components/Layout';
import { getUserClassifications, deleteClassification, ClassificationRecord } from '@/lib/supabaseService';
import { Search, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ClassificationHistory = () => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<ClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredClassifications = classifications.filter(c =>
    c.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.hs_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!userId) {
    return (
      <Layout className="pt-28 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view your classification history.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Classification History</h1>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">
            <p>Loading classifications...</p>
          </div>
        ) : filteredClassifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No classifications found.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HS Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClassifications.map((classification) => (
                  <tr key={classification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(classification.classification_date!)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {classification.product_description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-blue-600">
                      {classification.hs_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {classification.confidence ? `${Math.round(classification.confidence)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {classification.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        <button
                          onClick={() => handleDelete(classification.id!)}
                          className="text-red-600 hover:text-red-900"
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
      </div>
    </Layout>
  );
};

export default ClassificationHistory;
