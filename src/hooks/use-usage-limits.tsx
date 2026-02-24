import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { getUserPlan, createUserPlan, logUsage, getUserUsageSummary } from '@/lib/supabaseService';
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
    batchProcessing: 0,
    seats: 1
  },
  starter: {
    classifications: 100,
    pgaCalculator: 5,
    batchProcessing: 0,
    seats: 1
  },
  growth: {
    classifications: 1000,
    pgaCalculator: -1,
    batchProcessing: 3,
    seats: 5
  },
  enterprise: {
    classifications: -1,
    pgaCalculator: -1,
    batchProcessing: -1,
    seats: -1
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

  useEffect(() => {
    async function loadUsageData() {
      try {
        setIsLoading(true);

        if (isLoaded && isSignedIn && userId) {
          let plan = await getUserPlan();

          if (!plan) {
            const email = user?.emailAddresses?.[0]?.emailAddress;
            const name = user?.fullName;
            plan = await createUserPlan(undefined, undefined, email ?? undefined, name ?? undefined);
          }

          setUserPlan(plan);

          const summary = await getUserUsageSummary();
          setUsageSummary(summary);

          if (summary) {
            setMonthlyUsage({
              classifications: summary.monthly_classifications || 0,
              pgaCalculator: summary.monthly_pga_usage || 0,
              batchProcessing: summary.monthly_batch_usage || 0
            });
          }
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsageData();
  }, [userId, isLoaded, isSignedIn]);

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

    if (limit === -1) return true;

    if (limit === 0) {
      toast.error(getUpgradeMessage(featureType, planType));
      return false;
    }

    if (currentUsage >= limit) {
      toast.error(getLimitReachedMessage(featureType, planType, limit));
      return false;
    }

    return true;
  };

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
      await logUsage(usageTypeMap[featureType], featureMap[featureType]);

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

  const reloadUsageData = async () => {
    if (!isSignedIn || !userId) return;

    try {
      setIsLoading(true);
      const summary = await getUserUsageSummary();
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

  const getUpgradeMessage = (featureType: string, currentPlan: string): string => {
    const messages: Record<string, Record<string, string>> = {
      batchProcessing: {
        starter: 'Batch processing is available on Growth and Enterprise plans. Upgrade to process multiple products at once.',
      }
    };
    return messages[featureType]?.[currentPlan] || 'This feature requires a plan upgrade.';
  };

  const getLimitReachedMessage = (featureType: string, currentPlan: string, limit: number): string => {
    const messages: Record<string, Record<string, string>> = {
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
    canUseClassification: () => !isLoading && checkFeatureAccess('classification'),
    canUsePGACalculator: () => !isLoading && checkFeatureAccess('pgaCalculator'),
    canUseBatchProcessing: () => !isLoading && checkFeatureAccess('batchProcessing'),
    planLimits: PLAN_LIMITS,
    isSignedIn: isSignedIn && !!userId,
    requiresAuth: !isSignedIn || !userId
  };
}
