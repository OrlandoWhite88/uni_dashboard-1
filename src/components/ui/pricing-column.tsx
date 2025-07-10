import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PricingColumnProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
  price: number;
  priceNote?: string;
  cta: {
    variant: "glow" | "default";
    label: string;
    href?: string;
    onClick?: () => void;
  };
  features: string[];
  variant?: "default" | "glow" | "glow-brand";
  className?: string;
}

export const PricingColumn: React.FC<PricingColumnProps> = ({
  name,
  description,
  icon,
  price,
  priceNote = "per month",
  cta,
  features,
  variant = "default",
  className
}) => {
  const isGlow = variant === "glow" || variant === "glow-brand";
  const isBrand = variant === "glow-brand";

  const handleCTAClick = () => {
    if (cta.onClick) {
      cta.onClick();
    } else if (cta.href) {
      if (cta.href.startsWith("http")) {
        window.open(cta.href, "_blank");
      } else {
        window.location.href = cta.href;
      }
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-background p-8 shadow-sm transition-all duration-300",
        {
          "border-primary/20 bg-gradient-to-b from-primary/5 to-transparent shadow-lg": isBrand,
          "border-border hover:shadow-md": variant === "default",
          "border-primary shadow-lg ring-1 ring-primary/20": isGlow && !isBrand,
        },
        className
      )}
    >
      {/* Popular badge for brand variant */}
      {isBrand && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
            Most Popular
          </div>
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div className="mb-6 flex justify-center">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              {
                "bg-primary/10 text-primary": isBrand,
                "bg-muted text-muted-foreground": variant === "default",
                "bg-primary/20 text-primary": isGlow && !isBrand,
              }
            )}
          >
            {icon}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-xl font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Price */}
      <div className="mb-6 text-center">
        <div className="mb-1">
          <span className="text-4xl font-bold">${price}</span>
          {priceNote && (
            <span className="ml-2 text-sm text-muted-foreground">{priceNote}</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-sm">
            <svg
              className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <div className="text-center">
        <Button
          onClick={handleCTAClick}
          className={cn(
            "w-full",
            {
              "bg-primary text-primary-foreground hover:bg-primary/90": 
                cta.variant === "glow" || isBrand,
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground": 
                cta.variant === "default" && !isBrand,
            }
          )}
          variant={cta.variant === "glow" || isBrand ? "default" : "outline"}
        >
          {cta.label}
        </Button>
      </div>
    </div>
  );
};
