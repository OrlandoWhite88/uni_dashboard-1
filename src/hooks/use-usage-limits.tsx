import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useDevAuth } from '@/components/DevWrapper';
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
  const clerkAuth = useAuth();
  const clerkUser = useUser();
  const devAuth = useDevAuth();
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
  
  // Use development auth in development, Clerk auth in production
  const { userId, isLoaded, isSignedIn } = isDevelopment 
    ? { userId: devAuth.user.id, isLoaded: devAuth.isLoaded, isSignedIn: devAuth.isSignedIn }
    : clerkAuth;
    
  const user = isDevelopment 
    ? {
        emailAddresses: [{ emailAddress: 'dev-user@example.com' }],
        fullName: 'Dev User'
      }
    : clerkUser.user;

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
        
        console.log('[useUsageLimits] loadUsageData called with:', {
          isLoaded,
          isSignedIn,
          userId: userId ? 'exists' : 'null',
          isDevelopment
        });
        
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
            console.log('User data for plan creation:', { email, name, userId });
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
        } else if (isLoaded) {
          console.log('Auth loaded but user state unclear:', { isSignedIn, userId });
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
        // Don't set userPlan to null immediately - we'll handle this in checkFeatureAccess
        // setUserPlan(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUsageData();
  }, [userId, isLoaded, isSignedIn, user]);

  // Function to check if user can use a specific feature
  const checkFeatureAccess = async (featureType: 'classification' | 'pgaCalculator' | 'batchProcessing'): Promise<boolean> => {
    // Debug logging to help identify the issue
    console.log('[useUsageLimits] checkFeatureAccess debug:', {
      featureType,
      isSignedIn,
      userId,
      userPlan: userPlan ? 'exists' : 'null',
      isLoaded,
      isLoading,
      isDevelopment
    });
    
    // If we're still loading and the user appears to be signed in, try to reload the data
    if (isLoading && isLoaded && isSignedIn && userId && !userPlan) {
      console.log('[useUsageLimits] User signed in but plan not loaded, attempting to reload...');
      try {
        const plan = await getUserPlan(userId);
        if (plan) {
          setUserPlan(plan);
          console.log('[useUsageLimits] Successfully loaded user plan:', plan);
        } else {
          // Create a new plan if none exists
          const email = user?.emailAddresses?.[0]?.emailAddress;
          const name = user?.fullName;
          const newPlan = await createUserPlan(userId, undefined, email, name);
          if (newPlan) {
            setUserPlan(newPlan);
            console.log('[useUsageLimits] Created new user plan:', newPlan);
          }
        }
      } catch (error) {
        console.error('[useUsageLimits] Error loading user plan:', error);
      }
    }
    
    // Check basic authentication first
    if (!isSignedIn || !userId) {
      console.log('[useUsageLimits] Access denied - not signed in:', {
        isSignedIn,
        userId: userId ? 'exists' : 'null'
      });
      toast.error('Please sign in to use this feature.');
      return false;
    }
    
    // If user is signed in but plan is not loaded, this might be a timing issue
    // In production, we should still allow the action but with a fallback
    if (!userPlan) {
      console.log('[useUsageLimits] User signed in but no plan loaded - allowing with free plan fallback');
      // For now, we'll assume free plan limits if no plan is loaded
      // This prevents the authentication error while still providing some protection
      const freeLimit = PLAN_LIMITS.free[featureType];
      if (freeLimit === 0) {
        toast.error('This feature requires a plan upgrade.');
        return false;
      }
      // Allow the action to proceed - the usage will be tracked when the plan loads
      return true;
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
