import React from "react";
import Layout from "@/components/Layout";
import { ArrowLeft, CheckCircle2, CreditCard, Zap, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import CustomButton from "@/components/ui/CustomButton";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { useAuth } from "@clerk/clerk-react";
import { createCheckoutSession } from "@/lib/stripeService";

const SettingsPage = () => {
  const { userId } = useAuth();
  const { 
    isLoading, 
    userPlan, 
    dailyUsage, 
    monthlyUsage, 
    freeLimit, 
    proLimit, 
    freeRemaining, 
    proRemaining,
    reloadUsageData
  } = useUsageLimits();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  // Handle plan upgrade
  const handleUpgrade = async () => {
    if (!userId) return;
    setIsUpgrading(true);
    
    try {
      console.log('Upgrade initiated for user:', userId);
      console.log('Using customer ID:', userPlan?.stripe_customer_id || userId);
      
      // Create success and cancel URLs with proper encoding
      const successUrl = `${window.location.origin}/settings?success=true`;
      const cancelUrl = `${window.location.origin}/settings?canceled=true`;
      
      console.log('Success URL:', successUrl);
      console.log('Cancel URL:', cancelUrl);
      
      // Create a checkout session with Stripe
      const session = await createCheckoutSession(
        userPlan?.stripe_customer_id || userId,
        successUrl,
        cancelUrl
      );
      
      console.log('Received session from Stripe:', session);
      
      if (!session || !session.url) {
        throw new Error('Invalid checkout session returned from Stripe');
      }
      
      console.log('Redirecting to:', session.url);
      
      // Redirect to Stripe checkout
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

  // Check for URL parameters after returning from Stripe
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL parameters on page load:', Object.fromEntries(urlParams.entries()));
    
    if (urlParams.get('success') === 'true') {
      console.log('Subscription successful! Reloading usage data.');
      alert('Subscription successful! Your plan has been upgraded.');
      reloadUsageData();
    } else if (urlParams.get('canceled') === 'true') {
      console.log('Subscription process was canceled by user.');
      alert('Subscription canceled. You can try again anytime.');
    }
    
    // Clear URL parameters
    if (urlParams.has('success') || urlParams.has('canceled')) {
      console.log('Clearing URL parameters');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [reloadUsageData]);
  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center">
          <Link to="/" className="mr-4 p-2 rounded-full hover:bg-secondary/80 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Settings</h1>
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
                  <h3 className="font-medium">Current Plan: {userPlan?.plan_type === 'pro' ? 'Pro' : 'Free'}</h3>
                  
                  {userPlan?.plan_type === 'free' ? (
                    <div className="mt-4">
                      <p className="mb-1">Daily Usage: {dailyUsage} / {freeLimit}</p>
                      <div className="w-full bg-secondary h-2 rounded-full">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (dailyUsage / freeLimit) * 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {freeRemaining} requests remaining today
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="mb-1">Monthly Usage: {monthlyUsage} / {proLimit}</p>
                      <div className="w-full bg-secondary h-2 rounded-full">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (monthlyUsage / proLimit) * 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {proRemaining} requests remaining this month
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-secondary/30 rounded-lg text-center">
                <p className="text-muted-foreground">Sign in to view your usage statistics</p>
              </div>
            )}
          </div>
          
          {/* Pricing Plans */}
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-medium mb-6">Choose Your Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* Free Plan */}
              <div className="bg-background border border-border rounded-xl p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <CreditCard className="text-muted-foreground" size={22} />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-center mb-2">Free Plan</h3>
                <div className="text-2xl font-bold text-center mb-2">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-muted-foreground text-center mb-4">Perfect for getting started with HS classification.</p>
                
                <ul className="space-y-2.5 mb-6">
                  {["10 classifications per day", "Basic support", "Single item processing", "24-hour access"].map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-center">
                  {userPlan?.plan_type === 'free' || !userPlan ? (
                    <CustomButton variant="outline" className="w-full" disabled>
                      Current Plan
                    </CustomButton>
                  ) : (
                    <CustomButton variant="outline" className="w-full" disabled>
                      Switch to Free
                    </CustomButton>
                  )}
                </div>
              </div>
              
              {/* Pro Plan */}
              <div className="bg-primary/5 border border-primary/30 rounded-xl p-6 relative transition-all hover:shadow-md">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-medium py-1 px-3 rounded-full">
                  Most Popular
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="text-primary" size={24} />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-center mb-2">Pro Plan</h3>
                <div className="text-2xl font-bold text-center mb-2">$49<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-muted-foreground text-center mb-4">For businesses with regular classification needs.</p>
                
                <ul className="space-y-2.5 mb-6">
                  {["1,000 classifications per month", "Priority support", "Batch processing", "Export to CSV/Excel", "API access"].map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-center">
                  {userPlan?.plan_type === 'pro' ? (
                    <CustomButton variant="outline" className="w-full" disabled>
                      Current Plan
                    </CustomButton>
                  ) : !userId ? (
                    <CustomButton className="w-full" disabled={!userId}>
                      Sign in to Upgrade
                    </CustomButton>
                  ) : (
                    <CustomButton 
                      className="w-full" 
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Upgrade Now'
                      )}
                    </CustomButton>
                  )}
                </div>
              </div>
              
              {/* Enterprise Plan */}
              <div className="bg-background border border-border rounded-xl p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <Building2 className="text-muted-foreground" size={22} />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-center mb-2">Enterprise</h3>
                <div className="text-2xl font-bold text-center mb-2">$299<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-muted-foreground text-center mb-4">For large organizations with high volume needs.</p>
                
                <ul className="space-y-2.5 mb-6">
                  {["100,000 classifications per month", "24/7 dedicated support", "Advanced batch processing", "Custom integrations", "Team management", "Dedicated account manager"].map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-center">
                  <CustomButton variant="outline" className="w-full">
                    Contact Sales
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
