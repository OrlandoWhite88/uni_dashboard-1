
import React from "react";
import { cn } from "@/lib/utils";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, variant = "default", size = "md", isLoading = false, icon, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70 disabled:pointer-events-none";
    
    const variantStyles = {
      default: "bg-primary text-primary-foreground hover:brightness-105 active:brightness-95 shadow-sm",
      outline: "border border-input bg-transparent hover:bg-secondary text-foreground",
      ghost: "bg-transparent hover:bg-secondary text-foreground",
      link: "bg-transparent underline-offset-4 hover:underline text-primary"
    };
    
    const sizeStyles = {
      sm: "h-9 px-3 text-sm rounded-md",
      md: "h-10 px-4 rounded-md",
      lg: "h-11 px-5 rounded-md"
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          isLoading && "opacity-80",
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        
        {children}

        {variant === "default" && (
          <span className="absolute inset-0 rounded-md bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
        )}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export default CustomButton;
