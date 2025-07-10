import React from "react";
import { useUsageLimits } from '@/hooks/use-usage-limits';
import Layout from "@/components/Layout";
import TradeComplianceFlags from "@/components/TradeComplianceFlags";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown, Zap } from 'lucide-react';

const TradeFlagsPage: React.FC = () => {
  const { isLoading, userPlan, getPlanInfo } = useUsageLimits();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hsCode = queryParams.get("hsCode") || "";

  const planInfo = getPlanInfo();

  // Show upgrade prompt only when PGA limit is reached for Starter users
  if (!isLoading && userPlan?.plan_type === 'starter' && planInfo && planInfo.remaining.pgaCalculator === 0) {
    return (
      <Layout className="pt-20 pb-16">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Compliance & PGA Requirements</h1>
            <p className="text-gray-600">
              Check PGA (Partner Government Agency) requirements, antidumping duties, and trade compliance flags for any HS code.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl bg-secondary/10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">PGA Calculator Limit Reached</h2>
              <p className="text-gray-600">
                You've used all 5 PGA calculator uses for this month
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Your current <Badge variant="outline">Starter</Badge> plan includes:
                </p>
                <div className="grid gap-3 max-w-md mx-auto">
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-gray-700">5 PGA calculator uses per month</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-gray-700">100 classifications per month</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-gray-700">Unlimited tariff calculator access</span>
                  </div>
                </div>
                
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold text-orange-600">
                      0 PGA calculator uses remaining
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Resets monthly with your billing cycle
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Growth Plan</CardTitle>
                    <div className="text-3xl font-bold">$490<span className="text-sm font-normal">/month</span></div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">Everything in Starter, plus:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>Unlimited</strong> PGA calculator</li>
                      <li>• 1,000 classifications/month</li>
                      <li>• Bulk processing (CSV upload)</li>
                      <li>• Advanced duty calculations</li>
                      <li>• Priority support</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Enterprise Plan</CardTitle>
                    <div className="text-3xl font-bold">$2200<span className="text-sm font-normal">/month</span></div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">Everything in Growth, plus:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>Unlimited</strong> everything</li>
                      <li>• API access</li>
                      <li>• Real-time monitoring</li>
                      <li>• Dedicated account manager</li>
                      <li>• Sub 2hr critical support</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center space-y-4">
                <Button 
                  size="lg"
                  onClick={async () => {
                    try {
                      const { createCheckoutSession } = await import('@/lib/stripeService');
                      const successUrl = `${window.location.origin}/settings?upgrade=success`;
                      const cancelUrl = `${window.location.origin}/settings?upgrade=cancelled`;
                      await createCheckoutSession('temp-customer-id', successUrl, cancelUrl, 'growth');
                    } catch (error) {
                      console.error('Failed to start checkout:', error);
                      // Fallback to email contact
                      window.open('mailto:sales@unicustoms.ai?subject=Upgrade to Growth Plan', '_blank');
                    }
                  }}
                >
                  Upgrade to Growth Plan
                </Button>
                <p className="text-sm text-muted-foreground">
                  Get unlimited PGA calculator access
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // For Growth and Enterprise users, show full access
  return (
    <Layout className="pt-20 pb-16">
      <div className="space-y-6">
        {planInfo && (
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-4 mb-6">
              <Badge variant={planInfo.planType === 'enterprise' ? 'default' : 'secondary'}>
                {planInfo.planType.charAt(0).toUpperCase() + planInfo.planType.slice(1)} Plan
              </Badge>
              <span className="text-sm font-medium">
                Unlimited PGA Calculator Access
              </span>
            </div>
          </div>
        )}
        
        <TradeComplianceFlags initialHsCode={hsCode} />
      </div>
    </Layout>
  );
};

export default TradeFlagsPage;
