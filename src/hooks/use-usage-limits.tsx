import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getDailyUsageCount, getMonthlyUsageCount, getUserPlan, createUserPlan } from '@/lib/supabaseService';
import { toast } from 'sonner';

export function useUsageLimits() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Load usage data
  useEffect(() => {
    async function loadUsageData() {
      if (!isLoaded || !isSignedIn || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get user plan
        let plan = await getUserPlan(userId);
        
        // If no plan exists, create one
        if (!plan) {
          plan = await createUserPlan(userId);
        }
        
        setUserPlan(plan);
        
        // Get usage counts
        const daily = await getDailyUsageCount(userId);
        const monthly = await getMonthlyUsageCount(userId);
        
        setDailyUsage(daily);
        setMonthlyUsage(monthly);
        
        // Check limits based on plan
        if (plan?.plan_type === 'free' && daily >= 10) {
          setIsLimitReached(true);
        } else if (plan?.plan_type === 'pro' && monthly >= 1000) {
          setIsLimitReached(true);
        } else {
          setIsLimitReached(false);
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUsageData();
  }, [userId, isLoaded, isSignedIn]);

  // Function to check if user can make a request
  const checkCanMakeRequest = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to use this feature');
      return false;
    }
    
    if (isLimitReached) {
      if (userPlan?.plan_type === 'free') {
        toast.error('Daily limit reached. Please upgrade to Pro for more requests.');
      } else {
        toast.error('Monthly limit reached. Please contact support for assistance.');
      }
      return false;
    }
    
    return true;
  };

  // Function to reload usage data
  const reloadUsageData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const plan = await getUserPlan(userId);
      setUserPlan(plan);
      
      const daily = await getDailyUsageCount(userId);
      const monthly = await getMonthlyUsageCount(userId);
      
      setDailyUsage(daily);
      setMonthlyUsage(monthly);
      
      // Check limits based on plan
      if (plan?.plan_type === 'free' && daily >= 10) {
        setIsLimitReached(true);
      } else if (plan?.plan_type === 'pro' && monthly >= 1000) {
        setIsLimitReached(true);
      } else {
        setIsLimitReached(false);
      }
    } catch (error) {
      console.error('Error reloading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    userPlan,
    dailyUsage,
    monthlyUsage,
    isLimitReached,
    checkCanMakeRequest,
    reloadUsageData,
    // For free plan
    freeLimit: 10,
    freeRemaining: Math.max(0, 10 - dailyUsage),
    // For pro plan
    proLimit: 1000,
    proRemaining: Math.max(0, 1000 - monthlyUsage)
  };
}
