
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { MenuIcon, X, Home, FileText, BarChart, Package, ChevronRight } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  const { isLoaded, userId } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Sidebar for bulk imports */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-background border-r border-border/40 shadow-lg transform transition-transform duration-300 ease-out-expo",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/30">
          <h2 className="text-lg font-medium">Operations</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="px-3 py-5">
          <nav className="space-y-1">
            <Link 
              to="/"
              className="flex items-center px-3 py-2.5 rounded-lg text-foreground hover:bg-secondary transition-colors group"
            >
              <Home size={18} className="mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Home</span>
            </Link>
            
            <div className="pt-2">
              <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Bulk Operations
              </h3>
              
              <Link 
                to="/bulk-import" 
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center">
                  <FileText size={18} className="mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span>CSV Import</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-60" />
              </Link>
              
              <Link 
                to="/batch-classify" 
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center">
                  <BarChart size={18} className="mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span>Batch Classification</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-60" />
              </Link>
              
              <Link 
                to="/export-results" 
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center">
                  <Package size={18} className="mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span>Export Results</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-60" />
              </Link>
            </div>
          </nav>
        </div>
      </div>
      
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="w-full border-b border-border/40 backdrop-blur-md bg-background/90 fixed top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="mr-4 p-2 rounded-full hover:bg-secondary/80 transition-colors md:flex"
              aria-label="Open menu"
            >
              <MenuIcon size={18} />
            </button>
            
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <div className="h-5 w-5 rounded-md bg-primary animate-pulse-light"></div>
              </div>
              <h1 className="text-xl font-medium tracking-tight group-hover:text-primary transition-colors">Uni HS Classification</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <SignedIn>
              {/* Show user button for signed in users */}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            <SignedOut>
              {/* Show sign in/up buttons for signed out users */}
              <button 
                onClick={() => navigate("/sign-in")}
                className="px-4 py-2 text-sm font-medium bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate("/sign-up")}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </button>
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
