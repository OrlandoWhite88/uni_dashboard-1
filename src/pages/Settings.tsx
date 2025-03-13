
import React from "react";
import Layout from "@/components/Layout";
import { ArrowLeft, CheckCircle2, CreditCard, Zap, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import CustomButton from "@/components/ui/CustomButton";

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

        <div className="space-y-8">
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
                  <CustomButton variant="outline" className="w-full">
                    Current Plan
                  </CustomButton>
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
                  <CustomButton className="w-full">
                    Upgrade Now
                  </CustomButton>
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
          
          {/* User Information */}
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-medium mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-3 rounded-lg border border-border bg-transparent focus:ring-2 focus:ring-primary/30 focus-visible:outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Company Name</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg border border-border bg-transparent focus:ring-2 focus:ring-primary/30 focus-visible:outline-none"
                  placeholder="Your Company"
                />
              </div>
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
    </Layout>
  );
};

export default SettingsPage;
