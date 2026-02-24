import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { getMonthlyUsageCount, getUserPlan, createUserPlan, logUsage, getUserUsageSummary } from '@/lib/supabaseService';
import { toast } from 'sonner';

interface UsageLimits {
  classifications: number;
  pgaCalculator: number;
  batchProcessing: number;
  seats: number;
}

interface PlanLimits {
  free: UsageLimits;
  starter: UsageLimits;
  growth: UsageLimits;
  enterprise: UsageLimits;
}

const PLAN_LIMITS: PlanLimits = {
  free: {
    classifications: 10,
    pgaCalculator: 3,
    batchProcessing: 0, // No batch processing
    seats: 1
  },
  starter: {
    classifications: 100,
    pgaCalculator: 5,
    batchProcessing: 0, // No batch processing
    seats: 1
  },
  growth: {
    classifications: 1000,
    pgaCalculator: -1, // Unlimited
    batchProcessing: 3, // 3 free tries then unlimited
    seats: 5
  },
  enterprise: {
    classifications: -1, // Unlimited
    pgaCalculator: -1, // Unlimited
    batchProcessing: -1, // Unlimited
    seats: -1 // Unlimited
  }
};

export function useUsageLimits() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [monthlyUsage, setMonthlyUsage] = useState({
    classifications: 0,
    pgaCalculator: 0,
    batchProcessing: 0
  });
  const [usageSummary, setUsageSummary] = useState<any>(null);

  // Load usage data
  useEffect(() => {
    async function loadUsageData() {
      try {
        setIsLoading(true);
        
        // Only load for logged-in users - no anonymous usage anymore
        if (isLoaded && isSignedIn && userId) {
          console.log('Loading user plan and usage data for logged-in user:', userId);
          
          // Get user plan
          let plan = await getUserPlan(userId);
          console.log('Retrieved user plan:', plan);
          
          // If no plan exists, create a free plan
          if (!plan) {
            console.log('No plan found, creating a free plan for user:', userId);
            const email = user?.emailAddresses?.[0]?.emailAddress;
            const name = user?.fullName;
            plan = await createUserPlan(userId, undefined, email, name);
            console.log('Created new plan:', plan);
          }
          
          setUserPlan(plan);
          
          // Get detailed usage summary
          const summary = await getUserUsageSummary(userId);
          console.log('Usage summary:', summary);
          setUsageSummary(summary);
          
          // Set monthly usage
          if (summary) {
            setMonthlyUsage({
              classifications: summary.monthly_classifications || 0,
              pgaCalculator: summary.monthly_pga_usage || 0,
              batchProcessing: summary.monthly_batch_usage || 0
            });
          }
        } else if (isLoaded && !isSignedIn) {
          // For non-signed-in users, redirect to sign-in
          console.log('User not signed in, will need to redirect to sign in');
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUsageData();
  }, [userId, isLoaded, isSignedIn]);

  // Function to check if user can use a specific feature
  const checkFeatureAccess = async (featureType: 'classification' | 'pgaCalculator' | 'batchProcessing'): Promise<boolean> => {
    if (!isSignedIn || !userId || !userPlan) {
      toast.error('Please sign in to use this feature.');
      return false;
    }

    const planType = userPlan.plan_type as keyof PlanLimits;
    const limits = PLAN_LIMITS[planType];
    
    if (!limits) {
      toast.error('Invalid plan type. Please contact support.');
      return false;
    }

    const currentUsage = monthlyUsage[featureType];
    const limit = limits[featureType];

    // Check if feature is unlimited (-1)
    if (limit === -1) {
      return true;
    }

    // Check if feature is not allowed (0)
    if (limit === 0) {
      const upgradeMessage = getUpgradeMessage(featureType, planType);
      toast.error(upgradeMessage);
      return false;
    }

    // Check if limit is reached
    if (currentUsage >= limit) {
      const upgradeMessage = getLimitReachedMessage(featureType, planType, limit);
      toast.error(upgradeMessage);
      return false;
    }

    return true;
  };

  // Function to log usage and update counts
  const recordUsage = async (featureType: 'classification' | 'pgaCalculator' | 'batchProcessing') => {
    if (!userId) return false;

    const usageTypeMap = {
      classification: 'classification',
      pgaCalculator: 'pga_calculator',
      batchProcessing: 'batch_processing'
    };

    const featureMap = {
      classification: 'hs_classification',
      pgaCalculator: 'pga_calculator',
      batchProcessing: 'batch_upload'
    };

    try {
      await logUsage(userId, usageTypeMap[featureType], featureMap[featureType]);
      
      // Update local usage count
      setMonthlyUsage(prev => ({
        ...prev,
        [featureType]: prev[featureType] + 1
      }));

      return true;
    } catch (error) {
      console.error('Error recording usage:', error);
      return false;
    }
  };

  // Function to reload usage data
  const reloadUsageData = async () => {
    if (!isSignedIn || !userId) return;

    try {
      setIsLoading(true);
      const summary = await getUserUsageSummary(userId);
      setUsageSummary(summary);
      
      if (summary) {
        setMonthlyUsage({
          classifications: summary.monthly_classifications || 0,
          pgaCalculator: summary.monthly_pga_usage || 0,
          batchProcessing: summary.monthly_batch_usage || 0
        });
      }
    } catch (error) {
      console.error('Error reloading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get upgrade messages
  const getUpgradeMessage = (featureType: string, currentPlan: string): string => {
    const messages = {
      batchProcessing: {
        starter: 'Batch processing is available on Growth and Enterprise plans. Upgrade to process multiple products at once.',
      }
    };

    return messages[featureType]?.[currentPlan] || 'This feature requires a plan upgrade.';
  };

  // Helper function to get limit reached messages
  const getLimitReachedMessage = (featureType: string, currentPlan: string, limit: number): string => {
    const messages = {
      classification: {
        starter: `You've reached your monthly limit of ${limit} classifications. Upgrade to Growth for 1,000 classifications per month.`,
        growth: `You've reached your monthly limit of ${limit} classifications. Upgrade to Enterprise for unlimited classifications.`
      },
      pgaCalculator: {
        starter: `You've used all ${limit} PGA calculator requests this month. Upgrade to Growth for unlimited access.`
      },
      batchProcessing: {
        growth: `You've used your ${limit} free batch processing tries. You now have unlimited batch processing with your Growth plan.`
      }
    };

    return messages[featureType]?.[currentPlan] || `You've reached the limit for this feature (${limit} per month).`;
  };

  // Get plan display information
  const getPlanInfo = () => {
    if (!userPlan) return null;

    const planType = userPlan.plan_type as keyof PlanLimits;
    const limits = PLAN_LIMITS[planType];
    
    return {
      planType,
      limits,
      usage: monthlyUsage,
      remaining: {
        classifications: limits.classifications === -1 ? -1 : Math.max(0, limits.classifications - monthlyUsage.classifications),
        pgaCalculator: limits.pgaCalculator === -1 ? -1 : Math.max(0, limits.pgaCalculator - monthlyUsage.pgaCalculator),
        batchProcessing: limits.batchProcessing === -1 ? -1 : Math.max(0, limits.batchProcessing - monthlyUsage.batchProcessing)
      }
    };
  };

  return {
    isLoading,
    userPlan,
    monthlyUsage,
    usageSummary,
    checkFeatureAccess,
    recordUsage,
    reloadUsageData,
    getPlanInfo,
    // Helper functions for components
    canUseClassification: () => !isLoading && checkFeatureAccess('classification'),
    canUsePGACalculator: () => !isLoading && checkFeatureAccess('pgaCalculator'),
    canUseBatchProcessing: () => !isLoading && checkFeatureAccess('batchProcessing'),
    // Plan limits for display
    planLimits: PLAN_LIMITS,
    // Authentication state
    isSignedIn: isSignedIn && !!userId,
    requiresAuth: !isSignedIn || !userId
  };
}
