import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

// Google Ads conversion tracking function
function gtag_report_conversion(url: string | undefined) {
  var callback = function () {
    if (typeof(url) != 'undefined') {
      window.location = url as Location | (string & Location);
    }
  };
  // @ts-ignore - gtag is defined in the global scope via the script in index.html
  gtag('event', 'conversion', {
      'send_to': 'AW-16933718921/QN6GCMayr7EaEImX0Io_',
      'value': 1.0,
      'currency': 'GBP',
      'event_callback': callback
  });
  return false;
};

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  const { isLoaded, userId } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="w-full border-b border-border/40 backdrop-blur-sm bg-background/80 fixed top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <img 
                src="/uni_logo.png" 
                alt="Uni Logo" 
                className="h-10 transition-opacity group-hover:opacity-90"
              />
            </Link>
            
            <nav className="ml-8 hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Single Product
              </Link>
              <Link to="/bulk-import" className="text-sm font-medium hover:text-primary transition-colors">
                Batch Processing
              </Link>
              <Link to="/tariff-calculator" className="text-sm font-medium hover:text-primary transition-colors">
                Tariff Calculator
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <SignedIn>
              {/* Show user button for signed in users */}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            <SignedOut>
              {/* Use Clerk's built-in components for sign in/up */}
              <div className="hidden md:block">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium bg-secondary rounded-md hover:bg-secondary/80 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                
                <SignUpButton mode="modal">
                  <button
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    onClick={() => gtag_report_conversion(undefined)}
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
              
              {/* Sign Up button for mobile users */}
              <div className="md:hidden">
                <SignUpButton mode="modal">
                  <button
                    className="p-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    onClick={() => gtag_report_conversion(undefined)}
                  >
                    <span className="sr-only">Sign Up</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-user-plus">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <line x1="19" y1="8" x2="19" y2="14"></line>
                      <line x1="16" y1="11" x2="22" y2="11"></line>
                    </svg>
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            
            <Link to="/settings" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <span className="text-xs font-medium">Uni AI</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className={cn("flex-1 pt-16", className)}>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
