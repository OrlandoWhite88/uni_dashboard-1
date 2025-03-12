
import React from "react";
import Layout from "@/components/Layout";
import { ArrowLeft, CheckCircle2, CreditCard, Zap, Building2, ChevronRight, Shield, Bell, Globe, User } from "lucide-react";
import { Link } from "react-router-dom";
import CustomButton from "@/components/ui/CustomButton";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center">
          <Link to="/" className="mr-4 p-2 rounded-full hover:bg-secondary/80 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="col-span-1">
            <div className="glass-card rounded-xl overflow-hidden">
              <nav className="space-y-1">
                <Link to="/settings" className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-l-2 border-primary">
                  <div className="flex items-center">
                    <CreditCard size={16} className="mr-3 text-primary" />
                    <span className="font-medium">Subscription</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
                
                <Link to="#" className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-all">
                  <div className="flex items-center">
                    <User size={16} className="mr-3 text-muted-foreground" />
                    <span>Account</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
                
                <Link to="#" className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-all">
                  <div className="flex items-center">
                    <Shield size={16} className="mr-3 text-muted-foreground" />
                    <span>Security</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
                
                <Link to="#" className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-all">
                  <div className="flex items-center">
                    <Bell size={16} className="mr-3 text-muted-foreground" />
                    <span>Notifications</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
                
                <Link to="#" className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-all">
                  <div className="flex items-center">
                    <Globe size={16} className="mr-3 text-muted-foreground" />
                    <span>Language & Region</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="col-span-1 md:col-span-2">
            {/* Pricing Plans */}
            <div className="glass-card p-6 rounded-xl mb-6">
              <h2 className="text-xl font-medium mb-2">Current Plan</h2>
              <p className="text-muted-foreground mb-6">Select the plan that works best for your needs.</p>
              
              <div className="space-y-4">
                {/* Free Plan */}
                <div className="bg-background border border-border rounded-xl p-5 transition-all hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mr-4 shrink-0">
                      <CreditCard className="text-muted-foreground" size={18} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Free Plan</h3>
                        <div className="text-lg font-semibold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">Perfect for getting started with HS classification.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>10 classifications per day</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Basic support</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Single item processing</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>24-hour access</span>
                        </div>
                      </div>
                      
                      <CustomButton variant="outline" className="w-full" disabled>
                        Current Plan
                      </CustomButton>
                    </div>
                  </div>
                </div>
                
                {/* Pro Plan */}
                <div className="bg-primary/5 border border-primary/30 rounded-xl p-5 relative transition-all hover:shadow-md">
                  <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full">
                    Most Popular
                  </div>
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-4 shrink-0">
                      <Zap className="text-primary" size={18} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Pro Plan</h3>
                        <div className="text-lg font-semibold">$49<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">For businesses with regular classification needs.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>1,000 classifications per month</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Priority support</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Batch processing</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Export to CSV/Excel</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>API access</span>
                        </div>
                      </div>
                      
                      <CustomButton className="w-full">
                        Upgrade Now
                      </CustomButton>
                    </div>
                  </div>
                </div>
                
                {/* Enterprise Plan */}
                <div className="bg-background border border-border rounded-xl p-5 transition-all hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mr-4 shrink-0">
                      <Building2 className="text-muted-foreground" size={18} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Enterprise</h3>
                        <div className="text-lg font-semibold">$299<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">For large organizations with high volume needs.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>100,000 classifications per month</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>24/7 dedicated support</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Advanced batch processing</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Custom integrations</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Team management</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                          <span>Dedicated account manager</span>
                        </div>
                      </div>
                      
                      <CustomButton variant="outline" className="w-full">
                        Contact Sales
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Account Information */}
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-medium mb-5">Account Information</h2>
              <Separator className="mb-6" />
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 rounded-lg border border-border bg-transparent focus:ring-2 focus:ring-primary/30 focus-visible:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Company Name</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg border border-border bg-transparent focus:ring-2 focus:ring-primary/30 focus-visible:outline-none"
                    placeholder="Your Company"
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-end">
                  <CustomButton variant="outline" className="mr-2">
                    Cancel
                  </CustomButton>
                  <CustomButton>
                    Save Changes
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
