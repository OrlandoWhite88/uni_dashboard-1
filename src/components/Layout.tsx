
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { MenuIcon, X, Home, FileText, BarChart, Package, ChevronRight, Settings } from "lucide-react";

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
          "fixed inset-y-0 left-0 z-50 w-80 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl transform transition-transform duration-300 ease-out-expo",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center">
              <div className="h-4 w-4 rounded-md bg-sidebar-primary animate-pulse-light"></div>
            </div>
            <h2 className="text-lg font-medium">Uni HS Classification</h2>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-sidebar-accent/80 transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="px-3 py-6">
          <nav className="space-y-1.5">
            <Link 
              to="/"
              className="flex items-center px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors group"
            >
              <Home size={18} className="mr-3 text-sidebar-foreground/70 group-hover:text-sidebar-primary transition-colors" />
              <span className="font-medium">Home</span>
            </Link>
            
            <div className="pt-3 pb-1">
              <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
                Bulk Operations
              </h3>
              
              <Link 
                to="/bulk-import" 
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors group"
              >
                <div className="flex items-center">
                  <FileText size={18} className="mr-3 text-sidebar-foreground/70 group-hover:text-sidebar-primary transition-colors" />
                  <span className="font-medium">CSV Import</span>
                </div>
                <ChevronRight size={16} className="text-sidebar-foreground/40" />
              </Link>
              
              <Link 
                to="/batch-classify" 
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors group"
              >
                <div className="flex items-center">
                  <BarChart size={18} className="mr-3 text-sidebar-foreground/70 group-hover:text-sidebar-primary transition-colors" />
                  <span className="font-medium">Batch Classification</span>
                </div>
                <ChevronRight size={16} className="text-sidebar-foreground/40" />
              </Link>
              
              <Link 
                to="/export-results" 
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors group"
              >
                <div className="flex items-center">
                  <Package size={18} className="mr-3 text-sidebar-foreground/70 group-hover:text-sidebar-primary transition-colors" />
                  <span className="font-medium">Export Results</span>
                </div>
                <ChevronRight size={16} className="text-sidebar-foreground/40" />
              </Link>
              
              <Link 
                to="/settings" 
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors group mt-2"
              >
                <div className="flex items-center">
                  <Settings size={18} className="mr-3 text-sidebar-foreground/70 group-hover:text-sidebar-primary transition-colors" />
                  <span className="font-medium">Settings</span>
                </div>
                <ChevronRight size={16} className="text-sidebar-foreground/40" />
              </Link>
            </div>
          </nav>
          
          <div className="absolute bottom-8 left-0 right-0 px-6">
            <div className="p-4 rounded-lg bg-sidebar-primary/5 border border-sidebar-border">
              <h4 className="font-medium mb-1.5">Need assistance?</h4>
              <p className="text-sm text-sidebar-foreground/70 mb-3">Get help with your classification needs</p>
              <Link 
                to="/settings" 
                className="text-sm font-medium text-sidebar-primary hover:underline"
              >
                Contact support →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="w-full border-b border-border/40 backdrop-blur-md bg-background/90 fixed top-0 z-30 h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
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
                className="px-4 py-1.5 text-sm font-medium bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate("/sign-up")}
                className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </button>
            </SignedOut>
          </div>
        </div>
      </header>
      
      <main className={cn("flex-1 pt-16", className)}>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
