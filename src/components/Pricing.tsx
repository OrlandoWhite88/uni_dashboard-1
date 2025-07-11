import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { User, Users } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { createCheckoutSession } from "@/lib/stripeService";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { toast } from "sonner";

import { Section } from "./ui/section";
import {
  PricingColumn,
  PricingColumnProps,
} from "./ui/pricing-column";

type Plan = {
  name: string;
  description: string;
  icon?: ReactNode;
  monthlyPrice: number;
  cta: {
    variant: "glow" | "default";
    label: string;
    href?: string;
    onClick?: () => void;
  };
  features: string[];
  variant?: PricingColumnProps["variant"];
};

interface PricingProps {
  title?: string;
  description?: string;
  plans?: Plan[] | false;
  className?: string;
}

export default function Pricing({
  title = "Transparent, Predictable Pricing",
  description = "No hidden fees, usage charges, or per-classification costs that create budget uncertainty. Choose the plan that fits your business needs.",
  plans,
  className,
}: PricingProps) {
  const { userId } = useAuth();
  const { userPlan } = useUsageLimits();

  // Handle plan upgrade via Stripe
  const handleUpgrade = async (targetPlan: 'starter' | 'growth' | 'enterprise') => {
    if (!userId) {
      toast.error("Please sign in to upgrade your plan");
      window.location.href = "/auth?mode=signin";
      return;
    }
    
    try {
      toast.loading("Redirecting to checkout...");
      
      const successUrl = `${window.location.origin}/settings?success=true`;
      const cancelUrl = `${window.location.origin}/settings?canceled=true`;
      
      const session = await createCheckoutSession(
        userPlan?.stripe_customer_id || userId,
        successUrl,
        cancelUrl,
        targetPlan
      );
      
      if (!session || !session.url) {
        throw new Error('Failed to create checkout session');
      }
      
      // This will redirect away from the page
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
    }
  };

  // Default plans if none provided
  const defaultPlans = [
    {
      name: "Free",
      description: "Get started with HS classification",
      icon: <User className="size-4" />,
      monthlyPrice: 0,
      cta: {
        variant: "default" as const,
        label: "Start For Free",
        href: "/auth?mode=signup",
      },
      features: [
        "AI-powered HS classification",
        "Basic Duty Calculator",
        "Classifications History",
        "Community support",
        "Max 1 Seat",
        "Up to 10 classifications/month",
        "3 PGA calculator uses/month",
      ],
      variant: "default" as const,
    },
    {
      name: "Starter",
      description: "Perfect for small businesses starting with HS classification",
      icon: <User className="size-4" />,
      monthlyPrice: 129,
      cta: {
        variant: "default" as const,
        label: "Upgrade Now",
        onClick: () => handleUpgrade('starter'),
      },
      features: [
        "Everything in Free",
        "Duty Calculator (MFN Only)",
        "Support within 24 hours",
        "Up to 100 classifications/month",
        "5 PGA calculator uses/month",
      ],
      variant: "default" as const,
    },
    {
      name: "Growth",
      description: "For growing businesses with higher classification volumes",
      icon: <Users className="size-4" />,
      monthlyPrice: 490,
      cta: {
        variant: "default" as const,
        label: "Upgrade Now",
        onClick: () => handleUpgrade('growth'),
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
      variant: "glow-brand" as const,
    },
    {
      name: "Enterprise",
      description: "For large organizations with complex trade operations",
      monthlyPrice: 2200,
      cta: {
        variant: "glow" as const,
        label: "Contact Sales",
        href: "https://form.typeform.com/to/yKoqyhC3",
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
      variant: "glow" as const,
    },
  ];

  const plansToShow = plans === false ? [] : (plans || defaultPlans);

  return (
    <Section className={cn(className)} id="pricing">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 px-4 text-center sm:gap-8">
          <h2 className="text-3xl leading-tight font-semibold text-balance sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="text-md text-muted-foreground max-w-[920px] font-medium text-balance sm:text-xl">
            {description}
          </p>
        </div>

        {plansToShow.length > 0 && (
          <div className="max-w-container mx-auto grid w-full grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
            {plansToShow.map((plan) => (
              <PricingColumn
                key={plan.name}
                name={plan.name}
                icon={plan.icon}
                description={plan.description}
                price={plan.monthlyPrice}
                priceNote={
                  plan.monthlyPrice === 0
                    ? "Free and open-source forever"
                    : "per month"
                }
                cta={plan.cta}
                features={plan.features}
                variant={plan.variant}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
