import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  Package, 
  Calculator, 
  Settings, 
  Menu, 
  X, 
  FileText, 
  Database, 
  ChevronRight, 
  LogOut, 
  User, 
  Layers, 
  BarChart3
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

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

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

const Layout = ({ children, className }: LayoutProps) => {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu when navigating
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Navigation items
  const navItems: NavItem[] = [
    {
      label: "Single Product",
      path: "/",
      icon: <Package className="h-4 w-4" />
    },
    {
      label: "My Classifications",
      path: "/my-classifications",
      icon: <Database className="h-4 w-4" />,
      requiresAuth: true
    },
    {
      label: "Batch Processing",
      path: "/bulk-import",
      icon: <Layers className="h-4 w-4" />
    },
    {
      label: "Tariff Calculator",
      path: "/tariff-calculator",
      icon: <Calculator className="h-4 w-4" />
    }
  ];
  
  // Check if a path is active
  const isActivePath = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header - semi-transparent, fixed at top */}
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
            
            {/* Desktop Navigation */}
            <nav className="ml-8 hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                // Skip auth-required items for signed-out users
                if (item.requiresAuth && !isLoaded) return null;
                if (item.requiresAuth && !userId) return null;
                
                const isActive = isActivePath(item.path);
                
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={cn(
                      "text-sm font-medium transition-colors flex items-center gap-1.5",
                      isActive 
                        ? "text-primary" 
                        : "text-foreground/80 hover:text-primary"
                    )}
                  >
                    {item.icon}
                    {item.label}
                    {isActive && (
                      <div className="h-1 w-1 rounded-full bg-primary mt-0.5" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            
            <SignedIn>
              {/* Show user button for signed in users */}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            <SignedOut>
              {/* Use Clerk's built-in components for sign in/up */}
              <div className="hidden md:flex items-center gap-2">
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
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile menu content */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-background border-r border-border p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <img 
                  src="/uni_logo.png" 
                  alt="Uni Logo" 
                  className="h-8 transition-opacity hover:opacity-90"
                />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Mobile navigation */}
            <nav className="space-y-6">
              {navItems.map((item) => {
                // Skip auth-required items for signed-out users
                if (item.requiresAuth && !isLoaded) return null;
                if (item.requiresAuth && !userId) return null;
                
                const isActive = isActivePath(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 text-base font-medium transition-colors",
                      isActive 
                        ? "text-primary" 
                        : "text-foreground/80 hover:text-primary"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={cn(
                      "p-2 rounded-md",
                      isActive ? "bg-primary/10" : "bg-muted"
                    )}>
                      {item.icon}
                    </div>
                    {item.label}
                  </Link>
                );
              })}
              
              <Link
                to="/settings"
                className="flex items-center gap-3 text-base font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="p-2 rounded-md bg-muted">
                  <Settings className="h-4 w-4" />
                </div>
                Settings
              </Link>
            </nav>
            
            {/* Mobile user section */}
            <div className="mt-8 pt-6 border-t border-border">
              <SignedIn>
                <div className="flex items-center gap-3 mb-4">
                  <UserButton afterSignOutUrl="/" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">
                      {user?.primaryEmailAddress?.emailAddress || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.fullName || "Account"}
                    </span>
                  </div>
                </div>
              </SignedIn>
              
              <SignedOut>
                <div className="flex flex-col gap-2">
                  <SignInButton mode="modal">
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-secondary rounded-md hover:bg-secondary/80 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  
                  <SignUpButton mode="modal">
                    <button
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      onClick={() => gtag_report_conversion(undefined)}
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className={cn("flex-1 pt-16", className)}>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;