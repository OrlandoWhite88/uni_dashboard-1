import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getDailyUsageCount, getMonthlyUsageCount, getUserPlan, createUserPlan, getAnonymousDailyUsageCount } from '@/lib/supabaseService';
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
      try {
        setIsLoading(true);
        
        // For logged-in users
        if (isLoaded && isSignedIn && userId) {
          console.log('Loading user plan and usage data for logged-in user:', userId);
          
          // Get user plan - log more details to debug issues
          let plan = await getUserPlan(userId);
          console.log('Retrieved user plan:', plan);
          
          // If no plan exists, create one
          if (!plan) {
            console.log('No plan found, creating a new one for user:', userId);
            plan = await createUserPlan(userId);
            console.log('Created new plan:', plan);
          }
          
          setUserPlan(plan);
          
          // Get usage counts
          const daily = await getDailyUsageCount(userId);
          const monthly = await getMonthlyUsageCount(userId);
          
          console.log('Usage data loaded:', { daily, monthly, planType: plan?.plan_type });
          
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
        } 
        // For anonymous users
        else if (isLoaded && !isSignedIn) {
          console.log('Loading usage data for anonymous user');
          
          // Use localStorage to track anonymous usage
          const anonymousUsage = getAnonymousDailyUsageCount();
          console.log('Anonymous usage:', anonymousUsage);
          
          // Anonymous users always have a free plan
          setUserPlan({ plan_type: 'free' });
          setDailyUsage(anonymousUsage);
          setMonthlyUsage(0); // No monthly tracking for anonymous
          
          // Check if limit reached (10 per day for anonymous)
          setIsLimitReached(anonymousUsage >= 10);
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
    console.log('Reloading usage data');
    
    setIsLoading(true);
    try {
      // For logged-in users
      if (isSignedIn && userId) {
        console.log('Reloading data for logged-in user:', userId);
        
        const plan = await getUserPlan(userId);
        console.log('Reloaded user plan:', plan);
        setUserPlan(plan);
        
        const daily = await getDailyUsageCount(userId);
        const monthly = await getMonthlyUsageCount(userId);
        
        console.log('Reloaded usage data:', { daily, monthly, planType: plan?.plan_type });
        
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
      } 
      // For anonymous users
      else if (isLoaded && !isSignedIn) {
        console.log('Reloading data for anonymous user');
        
        // Use localStorage to track anonymous usage
        const anonymousUsage = getAnonymousDailyUsageCount();
        
        // Anonymous users always have a free plan
        setUserPlan({ plan_type: 'free' });
        setDailyUsage(anonymousUsage);
        setMonthlyUsage(0);
        
        // Check if limit reached
        setIsLimitReached(anonymousUsage >= 10);
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
