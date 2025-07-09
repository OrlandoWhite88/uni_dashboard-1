import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NavigationSidebar } from "./NavigationSidebar";

// Google Ads conversion tracking function
function gtag_report_conversion(url: string | undefined) {
  var callback = function () {
    if (typeof(url) != 'undefined') {
      window.location.href = url;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock organizations for demo - replace with actual data
  const organizations = [
    { id: '1', name: 'Uni Customs', icon: '/uni_logo.png' },
    { id: '2', name: 'Freight World Wide', icon: '/uni_logo.png' },
    { id: '3', name: 'Rohlig Logistics', icon: '/uni_logo.png' },
  ];

  const handleOrganizationChange = (org: { id: string; name: string; icon?: string }) => {
    console.log('Organization changed to:', org);
    // Handle organization change logic here
  };

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // Handle search logic here
  };

  return (
    <div className="min-h-screen w-full bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full">
        <NavigationSidebar
          organizationName="Uni Customs"
          organizations={organizations}
          onOrganizationChange={handleOrganizationChange}
          onSearch={handleSearch}
          searchPlaceholder="Search features..."
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full" onClick={(e) => e.stopPropagation()}>
            <NavigationSidebar
              organizationName="Uni Customs"
              organizations={organizations}
              onOrganizationChange={handleOrganizationChange}
              onSearch={handleSearch}
              searchPlaceholder="Search features..."
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px]">
        <header className="w-full border-b border-border/40 backdrop-blur-sm bg-background/80 fixed top-0 right-0 left-0 md:left-[280px] z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md hover:bg-secondary/80 transition-colors mr-4"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Optional: Add page title or breadcrumbs here */}
            </div>
            
            <div className="flex items-center gap-3">
              <SignedIn>
                {/* Show user button for signed in users */}
                <UserButton afterSignOutUrl="/dashboard" />
              </SignedIn>
              
              <SignedOut>
                {/* Use Clerk's built-in components for sign in/up */}
                <div className="hidden md:flex gap-2">
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
    </div>
  );
};

export default Layout;
