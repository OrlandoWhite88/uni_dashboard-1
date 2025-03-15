import React from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@clerk/clerk-react";
import CustomButton from "@/components/ui/CustomButton";
import { ArrowLeft, RefreshCcw, Zap } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * This page is used for debugging Stripe and user plan issues.
 * It shows detailed information about the current user's plan and provides
 * admin functions to help troubleshoot subscription issues.
 */
const DebugStripePage = () => {
  const { userId } = useAuth();
  const [userPlan, setUserPlan] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [checkoutSessionId, setCheckoutSessionId] = React.useState('');
  const [actionResult, setActionResult] = React.useState<{message: string, isError: boolean} | null>(null);

  // Load user plan data
  React.useEffect(() => {
    const loadPlanData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get user plan
        const { getUserPlan } = await import('@/lib/supabaseService');
        const plan = await getUserPlan(userId);
        
        setUserPlan(plan);
        console.log('Debug - User plan data:', plan);
      } catch (error) {
        console.error('Error loading plan data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlanData();
  }, [userId]);

  // Force upgrade to Pro
  const forceUpgradeToPro = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setActionResult(null);
      
      // Import the update function
      const { updateUserPlan } = await import('@/lib/supabaseService');
      
      // Force update to Pro
      const timestamp = new Date();
      const result = await updateUserPlan(userId, {
        plan_type: 'pro',
        subscribed_at: timestamp,
        updated_at: timestamp,
        stripe_customer_id: 'cus_force_' + Math.random().toString(36).substring(2, 10),
        last_checkout_session: 'forced_upgrade_' + Date.now()
      });
      
      console.log('Force upgrade result:', result);
      
      if (result) {
        setUserPlan(result);
        setActionResult({
          message: 'Successfully forced upgrade to Pro plan!',
          isError: false
        });
      } else {
        setActionResult({
          message: 'Failed to force upgrade. Check console for details.',
          isError: true
        });
      }
    } catch (error) {
      console.error('Error forcing upgrade:', error);
      setActionResult({
        message: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Force downgrade to Free
  const forceDowngradeToFree = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setActionResult(null);
      
      // Import the update function
      const { updateUserPlan } = await import('@/lib/supabaseService');
      
      // Force update to Free
      const result = await updateUserPlan(userId, {
        plan_type: 'free',
        subscribed_at: null,
        updated_at: new Date(),
        last_checkout_session: 'forced_downgrade_' + Date.now()
      });
      
      console.log('Force downgrade result:', result);
      
      if (result) {
        setUserPlan(result);
        setActionResult({
          message: 'Successfully forced downgrade to Free plan!',
          isError: false
        });
      } else {
        setActionResult({
          message: 'Failed to force downgrade. Check console for details.',
          isError: true
        });
      }
    } catch (error) {
      console.error('Error forcing downgrade:', error);
      setActionResult({
        message: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user plan data
  const refreshPlanData = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setActionResult(null);
      
      // Get user plan
      const { getUserPlan } = await import('@/lib/supabaseService');
      const plan = await getUserPlan(userId);
      
      setUserPlan(plan);
      console.log('Refreshed user plan data:', plan);
      
      setActionResult({
        message: 'Successfully refreshed user plan data!',
        isError: false
      });
    } catch (error) {
      console.error('Error refreshing plan data:', error);
      setActionResult({
        message: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set checkout session ID manually and update plan
  const handleCheckoutUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !checkoutSessionId.trim()) return;
    
    try {
      setIsLoading(true);
      setActionResult(null);
      
      // Import the update function
      const { updateUserPlan } = await import('@/lib/supabaseService');
      
      // Update with checkout session ID
      const timestamp = new Date();
      const result = await updateUserPlan(userId, {
        plan_type: 'pro',
        subscribed_at: timestamp,
        updated_at: timestamp,
        stripe_customer_id: 'cus_manual_' + Math.random().toString(36).substring(2, 10),
        last_checkout_session: checkoutSessionId
      });
      
      console.log('Manual checkout update result:', result);
      
      if (result) {
        setUserPlan(result);
        setActionResult({
          message: 'Successfully updated plan with checkout session ID!',
          isError: false
        });
      } else {
        setActionResult({
          message: 'Failed to update with checkout session. Check console for details.',
          isError: true
        });
      }
    } catch (error) {
      console.error('Error updating with checkout session:', error);
      setActionResult({
        message: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/settings" className="mr-4 p-2 rounded-full hover:bg-secondary/80 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-semibold">Stripe Debug</h1>
          </div>
          
          <CustomButton
            onClick={refreshPlanData}
            disabled={isLoading || !userId}
            variant="outline"
            size="sm"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Data
          </CustomButton>
        </div>

        {/* User Info */}
        <div className="glass-card p-6 rounded-xl mb-6">
          <h2 className="text-xl font-medium mb-4">User Information</h2>
          
          {!userId ? (
            <div className="p-4 bg-secondary/30 rounded-lg text-center">
              <p className="text-muted-foreground">Please sign in to view debug information</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 bg-secondary/30 rounded-lg text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">User ID:</h3>
                <p className="font-mono text-sm bg-secondary/20 p-2 rounded">{userId}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Plan Type:</h3>
                <p className="font-mono text-sm bg-secondary/20 p-2 rounded">
                  {userPlan?.plan_type || 'No plan found'}
                  {userPlan?.plan_type === 'pro' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <Zap className="mr-1 h-3 w-3" />
                      PRO
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Stripe Customer ID:</h3>
                <p className="font-mono text-sm bg-secondary/20 p-2 rounded">
                  {userPlan?.stripe_customer_id || 'None'}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Subscribed At:</h3>
                <p className="font-mono text-sm bg-secondary/20 p-2 rounded">
                  {userPlan?.subscribed_at ? new Date(userPlan.subscribed_at).toLocaleString() : 'Never'}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Last Updated:</h3>
                <p className="font-mono text-sm bg-secondary/20 p-2 rounded">
                  {userPlan?.updated_at ? new Date(userPlan.updated_at).toLocaleString() : 'Never'}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Last Checkout Session:</h3>
                <p className="font-mono text-sm bg-secondary/20 p-2 rounded">
                  {userPlan?.last_checkout_session || 'None'}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Raw Plan Data:</h3>
                <pre className="font-mono text-xs bg-secondary/20 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(userPlan, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        {/* Admin Actions */}
        <div className="glass-card p-6 rounded-xl mb-6">
          <h2 className="text-xl font-medium mb-4">Admin Actions</h2>
          
          {!userId ? (
            <div className="p-4 bg-secondary/30 rounded-lg text-center">
              <p className="text-muted-foreground">Please sign in to access admin actions</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Force Upgrade/Downgrade */}
              <div className="space-y-4">
                <h3 className="font-medium">Force Plan Change:</h3>
                <div className="flex space-x-4">
                  <CustomButton
                    onClick={forceUpgradeToPro}
                    disabled={isLoading || userPlan?.plan_type === 'pro'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Force Upgrade to Pro
                  </CustomButton>
                  
                  <CustomButton
                    onClick={forceDowngradeToFree}
                    disabled={isLoading || !userPlan || userPlan?.plan_type === 'free'}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Force Downgrade to Free
                  </CustomButton>
                </div>
              </div>
              
              {/* Manual Checkout Session */}
              <div className="space-y-4">
                <h3 className="font-medium">Manual Checkout Update:</h3>
                <form onSubmit={handleCheckoutUpdateSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={checkoutSessionId}
                    onChange={(e) => setCheckoutSessionId(e.target.value)}
                    placeholder="Enter checkout session ID"
                    className="w-full px-3 py-2 border border-border rounded-md"
                    disabled={isLoading}
                  />
                  
                  <CustomButton
                    type="submit"
                    disabled={isLoading || !checkoutSessionId.trim()}
                  >
                    Update With Checkout Session
                  </CustomButton>
                </form>
              </div>
              
              {/* Result Message */}
              {actionResult && (
                <div 
                  className={`p-4 rounded-md ${
                    actionResult.isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {actionResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DebugStripePage;
