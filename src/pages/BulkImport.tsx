import React, { useState, useEffect } from "react";
import { useAuth } from '@clerk/clerk-react';
import { useUsageLimits } from '@/hooks/use-usage-limits';
import Layout from '@/components/Layout';
import BulkImportFiles from "./BulkImportFiles";
import BatchClassify from "./BatchClassify";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BulkImport = () => {
  const { userId } = useAuth();
  const { 
    isLoading, 
    userPlan, 
    checkFeatureAccess, 
    getPlanInfo,
    planLimits 
  } = useUsageLimits();
  
  // This will hold both CSV file data and pasted text
  const [importedData, setCsvFile] = useState<string | ArrayBuffer>("");
  const [submitted, setSubmitted] = useState(false);
  const [canUseBatch, setCanUseBatch] = useState(false);
  
  // Check if user can access batch processing
  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading && userId) {
        const hasAccess = await checkFeatureAccess('batchProcessing');
        setCanUseBatch(hasAccess);
      }
    };
    
    checkAccess();
  }, [isLoading, userId, checkFeatureAccess]);

  const planInfo = getPlanInfo();
  
  // Display the appropriate screen based on submission state
  if (submitted) {
    return (
      <Layout>
        <BatchClassify csvFile={importedData} />
      </Layout>
    );
  }

  // Show access restriction for Starter plan users
  if (!isLoading && userPlan?.plan_type === 'starter') {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Processing</h1>
            <p className="text-gray-600">
              Process multiple products at once using our batch classification and CSV upload features.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl bg-secondary/10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Bulk Processing</h2>
              <p className="text-gray-600">
                Batch processing is available on Growth and Enterprise plans
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
                    <span className="text-gray-700">100 classifications per month</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-gray-700">Single product classification</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-gray-700">5 PGA calculator uses</span>
                  </div>
                </div>
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
                      <li>• 1,000 classifications/month</li>
                      <li>• <strong>Bulk processing (CSV upload)</strong></li>
                      <li>• Advanced duty calculations</li>
                      <li>• Up to 5 seats</li>
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
                      <li>• <strong>Unlimited</strong> classifications</li>
                      <li>• <strong>Unlimited</strong> bulk processing</li>
                      <li>• API access</li>
                      <li>• Unlimited seats</li>
                      <li>• Dedicated account manager</li>
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
                  Contact our sales team to discuss your needs and get started
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // For Growth and Enterprise users, show the full interface
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Processing</h1>
          <p className="text-gray-600">
            Process multiple products at once using our batch classification or CSV upload features.
          </p>
          
          {planInfo && (
            <div className="mt-4 flex items-center gap-4">
              <Badge variant={planInfo.planType === 'enterprise' ? 'default' : 'secondary'}>
                {planInfo.planType.charAt(0).toUpperCase() + planInfo.planType.slice(1)} Plan
              </Badge>
              
              {planInfo.planType === 'growth' && planInfo.remaining.batchProcessing !== -1 && (
                <span className="text-sm text-muted-foreground">
                  {planInfo.remaining.batchProcessing === 0 
                    ? "Unlimited batch processing available" 
                    : `${planInfo.remaining.batchProcessing} free batch tries remaining`
                  }
                </span>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="batch" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batch">Batch Classification</TabsTrigger>
            <TabsTrigger value="upload">CSV Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Batch Classification
                </CardTitle>
                <CardDescription>
                  Enter multiple product descriptions below and classify them all at once.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BatchClassify csvFile="" />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  CSV File Upload
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with product descriptions to classify multiple items efficiently.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BulkImportFiles
                  setCsvFile={setCsvFile}
                  csvFile={importedData}
                  setSubmitted={setSubmitted}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BulkImport;
