"use client";

import React from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Zap, Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomButton from "@/components/ui/CustomButton";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { useAuth, useUser } from "@clerk/nextjs";
import { createCheckoutSession } from "@/lib/stripeService";
import Pricing from "@/components/Pricing";

const SettingsPage = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const { 
    isLoading, 
    userPlan, 
    monthlyUsage, 
    getPlanInfo,
    reloadUsageData
  } = useUsageLimits();

  const planInfo = getPlanInfo();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  // Handle plan upgrade
  const handleUpgrade = async (targetPlan: 'starter' | 'growth' | 'enterprise') => {
    if (!userId) return;
    setIsUpgrading(true);
    
    try {
      const successUrl = `${window.location.origin}/settings?success=true`;
      const cancelUrl = `${window.location.origin}/settings?canceled=true`;
      
      const session = await createCheckoutSession(
        userPlan?.stripe_customer_id || userId,
        successUrl,
        cancelUrl,
        targetPlan
      );
      
      console.log('Received session from Stripe:', session);
      
      if (!session || !session.url) {
        throw new Error('Invalid checkout session returned from Stripe');
      }
      
      console.log('Redirecting to:', session.url);
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        alert(`Error: ${error.message}. Please try again later.`);
      } else {
        alert('An unknown error occurred. Please try again later.');
      }
      setIsUpgrading(false);
    }
  };

  React.useEffect(() => {
    const checkStripeRedirect = async () => {
      const { updateUserPlan } = await import('@/lib/supabaseService');
      const { getStoredCheckoutSession, clearStoredCheckoutSession, validateCheckoutSession } = await import('@/lib/stripeService');
    
      const urlParams = new URLSearchParams(window.location.search);
      console.log('URL parameters on page load:', Object.fromEntries(urlParams.entries()));
      
      const hasSuccessParam = urlParams.get('success') === 'true';
      const hasCanceledParam = urlParams.get('canceled') === 'true';
      const storedSession = getStoredCheckoutSession();
      
      console.log('Checking checkout status:', { 
        hasSuccessParam, 
        hasCanceledParam,
        hasStoredSession: !!storedSession,
        userId
      });
      
      if (hasCanceledParam) {
        console.log('Subscription process was canceled by user.');
        clearStoredCheckoutSession();
        alert('Subscription canceled. You can try again anytime.');
        return;
      }
      
      if (hasSuccessParam && storedSession && validateCheckoutSession(hasSuccessParam)) {
        console.log('Subscription successful! Updating plan and reloading usage data.');
        clearStoredCheckoutSession();
        
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            'send_to': 'AW-16933718921',
          });
          console.log('Google Ads conversion tracking event fired');
        }
        
        if (!userId) {
          console.warn('Cannot update plan: No user ID available');
          return;
        }
        
        try {
          console.log('Updating user plan for user:', userId);
          
          const timestamp = new Date();
          const planType = storedSession && storedSession.includes('starter') ? 'starter' :
                          storedSession && storedSession.includes('growth') ? 'growth' :
                          storedSession && storedSession.includes('enterprise') ? 'enterprise' : 'free';
          
          const email = user?.emailAddresses?.[0]?.emailAddress;
          const name = user?.fullName;
          
          const updatedPlan = await updateUserPlan(userId, { 
            plan_type: planType,
            subscribed_at: timestamp,
            updated_at: timestamp,
            stripe_customer_id: 'cus_' + Math.random().toString(36).substring(2, 10),
            last_checkout_session: storedSession || 'direct_success',
            email: email,
            name: name
          });
          
          console.log('Plan updated successfully:', updatedPlan);
          
          if (updatedPlan) {
            alert('Subscription successful! Your plan has been upgraded.');
            console.log('Reloading page to refresh data...');
            setTimeout(() => window.location.reload(), 500);
          } else {
            console.warn('Plan update may not have succeeded, trying to reload data');
            reloadUsageData();
            alert('Subscription successful! Refreshing your account data...');
          }
        } catch (error) {
          console.error('Error updating user plan:', error);
          alert('Your payment was successful, but we had trouble updating your account. Please contact support.');
        }
      } else if (hasSuccessParam && !storedSession) {
        console.log('Success parameter detected but no stored session found. Possible tampering attempt.');
        alert('Unable to verify your subscription. If you completed payment, please contact support.');
        return;
      }
      
      if (urlParams.has('success') || urlParams.has('canceled') || urlParams.has('t')) {
        console.log('Clearing URL parameters');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    checkStripeRedirect();
  }, [userId]);

  const getCurrentPricingPlans = () => {
    const currentPlan = userPlan?.plan_type || 'free';
    
    return [
      {
        name: "Starter",
        description: "Perfect for small businesses starting with HS classification",
        monthlyPrice: 129,
        cta: {
          variant: "default" as const,
          label: currentPlan === 'starter' ? "Current Plan" : "Upgrade Now",
          onClick: currentPlan !== 'starter' ? () => handleUpgrade('starter') : undefined,
        },
        features: [
          "AI-powered HS classification",
          "Basic Duty Calculator (MFN Only)",
          "Classifications History",
          "Support within 24 hours",
          "Max 1 Seat",
          "Up to 100 classifications/month",
          "5 PGA calculator uses/month",
        ],
        variant: currentPlan === 'starter' ? "glow-brand" as const : "default" as const,
        isCurrentPlan: currentPlan === 'starter',
        disabled: currentPlan === 'starter',
        onClick: () => currentPlan !== 'starter' && handleUpgrade('starter')
      },
      {
        name: "Growth",
        description: "For growing businesses with higher classification volumes",
        monthlyPrice: 490,
        cta: {
          variant: "default" as const,
          label: currentPlan === 'growth' ? "Current Plan" : "Upgrade Now",
          onClick: currentPlan !== 'growth' ? () => handleUpgrade('growth') : undefined,
        },
        features: [
          "Everything in Starter",
          "Bulk processing (CSV upload)",
          "Advanced duty calculations (MFN, GSP, FTA)",
          "Full PGA, AD / CVD Flags",
          "Notification of tariff changes",
          "Priority support within 4 hours",
          "Max 5 Seats",
          "Up to 1,000 Classifications/month",
          "Unlimited PGA calculator uses",
          "3 free batch processing tries",
        ],
        variant: currentPlan === 'growth' ? "glow-brand" as const : "glow" as const,
        isCurrentPlan: currentPlan === 'growth',
        disabled: currentPlan === 'growth',
        onClick: () => currentPlan !== 'growth' && handleUpgrade('growth')
      },
      {
        name: "Enterprise",
        description: "For large organizations with complex trade operations",
        monthlyPrice: 2200,
        cta: {
          variant: "glow" as const,
          label: currentPlan === 'enterprise' ? "Current Plan" : "Upgrade Now",
          onClick: currentPlan !== 'enterprise' ? () => handleUpgrade('enterprise') : undefined,
        },
        features: [
          "Everything in Growth",
          "Unlimited classifications",
          "Unlimited Seats",
          "Unlimited batch processing",
          "API Access",
          "Real Time Monitoring and Webhook Alerts",
          "Dedicated account manager + Certified Customs Broker",
          "Sub 2hr Critical Support",
          "Fine Tuning on User Data on Premise",
        ],
        variant: currentPlan === 'enterprise' ? "glow-brand" as const : "glow" as const,
        isCurrentPlan: currentPlan === 'enterprise',
        disabled: currentPlan === 'enterprise',
        onClick: () => currentPlan !== 'enterprise' && handleUpgrade('enterprise')
      },
    ];
  };
  
  return (
    <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center">
          <button 
            onClick={() => router.push('/product')} 
            className="mr-4 p-2 rounded-full hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Settings & Pricing</h1>
        </div>

        <div className="space-y-8">
          {/* Usage Statistics */}
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-medium mb-4">Your Usage</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : userId ? (
              <div>
                <div className="mb-4">
                  <h3 className="font-medium">Current Plan: {userPlan?.plan_type?.charAt(0).toUpperCase() + (userPlan?.plan_type?.slice(1) || 'Free')}</h3>
                  
                  <div className="mt-4">
                    <p className="mb-1">Monthly Classifications: {monthlyUsage?.classifications || 0} / {planInfo?.limits.classifications === -1 ? 'Unlimited' : planInfo?.limits.classifications || 10}</p>
                    {planInfo?.limits.classifications !== -1 && (
                      <>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(100, ((monthlyUsage?.classifications || 0) / (planInfo?.limits.classifications || 1)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {Math.max(0, (planInfo?.limits.classifications || 10) - (monthlyUsage?.classifications || 0))} classifications remaining this month
                        </p>
                      </>
                    )}

                    {monthlyUsage?.pgaCalculator !== undefined && (
                      <div className="mt-4">
                        <p className="mb-1">PGA Calculator: {monthlyUsage.pgaCalculator} / {planInfo?.limits.pgaCalculator === -1 ? 'Unlimited' : planInfo?.limits.pgaCalculator || 3}</p>
                        {planInfo?.limits.pgaCalculator !== -1 && (
                          <>
                            <div className="w-full bg-secondary h-2 rounded-full">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.min(100, (monthlyUsage.pgaCalculator / (planInfo?.limits.pgaCalculator || 1)) * 100)}%` }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {Math.max(0, (planInfo?.limits.pgaCalculator || 3) - monthlyUsage.pgaCalculator)} PGA uses remaining this month
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-secondary/30 rounded-lg text-center">
                <p className="text-muted-foreground">Sign in to view your usage statistics</p>
              </div>
            )}
          </div>

          {/* Pricing Plans */}
          <Pricing 
            title="Choose Your Plan"
            description="Upgrade or downgrade your plan to fit your business needs. All plans include our core AI-powered HS classification technology."
            plans={getCurrentPricingPlans()}
          />
        </div>
    </div>
  );
};

export default SettingsPage;
