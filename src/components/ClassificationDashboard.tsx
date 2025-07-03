import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getUserClassifications, ClassificationRecord, getTariffChangeStats, checkTariffChanges } from '@/lib/supabaseService';
import { 
  Calendar, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalClassifications: number;
  recentClassifications: number;
  needsReview: number;
  lastUpdated: string;
}

interface TariffStats {
  total: number;
  changed: number;
  needsReview: number;
  recentChanges: number;
}

const ClassificationDashboard = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalClassifications: 0,
    recentClassifications: 0,
    needsReview: 0,
    lastUpdated: new Date().toISOString()
  });
  const [recentClassifications, setRecentClassifications] = useState<ClassificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tariffStats, setTariffStats] = useState<TariffStats>({
    total: 0,
    changed: 0,
    needsReview: 0,
    recentChanges: 0
  });
  const [checkingTariffs, setCheckingTariffs] = useState(false);

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const classifications = await getUserClassifications(userId, 10); // Get last 10
      
      // Calculate stats
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      
      const recentCount = classifications.filter(c => 
        new Date(c.classification_date!) > thirtyDaysAgo
      ).length;
      
      // Classifications older than 6 months might need review
      const needsReviewCount = classifications.filter(c => 
        new Date(c.classification_date!) < sixMonthsAgo
      ).length;
      
      setStats({
        totalClassifications: classifications.length,
        recentClassifications: recentCount,
        needsReview: needsReviewCount,
        lastUpdated: new Date().toISOString()
      });
      
      setRecentClassifications(classifications.slice(0, 5)); // Show top 5
      
      // Load tariff change stats
      const tariffChangeStats = await getTariffChangeStats(userId);
      setTariffStats(tariffChangeStats);
      
      // Check for tariff changes in background
      checkTariffsInBackground();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTariffsInBackground = async () => {
    if (!userId || checkingTariffs) return;
    
    setCheckingTariffs(true);
    try {
      console.log('Checking for tariff changes...');
      const result = await checkTariffChanges(userId);
      
      if (result.changed > 0) {
        // Update tariff stats after changes detected
        const updatedStats = await getTariffChangeStats(userId);
        setTariffStats(updatedStats);
      }
      
      console.log(`Tariff check completed: ${result.checked} checked, ${result.changed} changed, ${result.errors} errors`);
    } catch (error) {
      console.error('Error checking tariff changes:', error);
    } finally {
      setCheckingTariffs(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!userId || loading) {
    return null; // Don't show dashboard for non-authenticated users or while loading
  }

  if (stats.totalClassifications === 0) {
    return null; // Don't show dashboard if no classifications exist
  }

  return (
    <div className="glass-card p-6 rounded-xl mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Classification Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Overview of your classification history and status
          </p>
        </div>
        <CustomButton
          variant="outline"
          size="sm"
          onClick={loadDashboardData}
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </CustomButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Total Classifications</span>
          </div>
          <div className="text-2xl font-bold text-primary">{stats.totalClassifications}</div>
        </div>

        <div className="bg-green-500/10 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Recent (30 days)</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.recentClassifications}</div>
        </div>

        <div className={`p-4 rounded-lg ${
          stats.needsReview > 0
            ? 'bg-red-500/10'
            : 'bg-gray-500/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`h-5 w-5 ${
              stats.needsReview > 0 ? 'text-red-600' : 'text-gray-600'
            }`} />
            <span className={`text-sm font-medium ${
              stats.needsReview > 0 ? 'text-red-800' : 'text-gray-800'
            }`}>Needs Review</span>
          </div>
          <div className={`text-2xl font-bold ${
            stats.needsReview > 0 ? 'text-red-600' : 'text-gray-600'
          }`}>{stats.needsReview}</div>
          <div className={`text-xs mt-1 ${
            stats.needsReview > 0 ? 'text-red-600' : 'text-gray-600'
          }`}>Tariff changes or HS code changes</div>
        </div>

        <div className="bg-blue-500/10 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Last Updated</span>
          </div>
          <div className="text-sm font-medium text-blue-600">
            {formatDate(stats.lastUpdated)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">HTS Revision: 2024</div>
        </div>
      </div>

      {/* Recent Classifications */}
      {recentClassifications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Recent Classifications</h4>
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/classification-history')}
              className="flex items-center text-sm"
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </CustomButton>
          </div>
          
          <div className="space-y-2">
            {recentClassifications.map((classification) => (
              <div 
                key={classification.id} 
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate('/classification-history')}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {classification.product_description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(classification.classification_date!)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-primary">
                    {classification.hs_code}
                  </span>
                  {classification.confidence && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(classification.confidence)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tariff Change Notifications */}
      {tariffStats.changed > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-800">
                {tariffStats.changed} classification{tariffStats.changed !== 1 ? 's have' : ' has'} tariff changes
              </div>
              <div className="text-xs text-red-700 mt-1">
                Tariff rates have changed for these classifications. Review recommended.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tariff Checking Status */}
      {checkingTariffs && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 animate-spin" />
            <div>
              <div className="text-sm font-medium text-blue-800">
                Checking for tariff changes...
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Comparing current tariff data with stored classifications.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {stats.needsReview > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-yellow-800">
                {stats.needsReview} classification{stats.needsReview !== 1 ? 's' : ''} may need review
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                These classifications may have tariff changes or HS code changes.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassificationDashboard;
