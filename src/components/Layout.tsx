
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { MenuIcon, X } from "lucide-react";

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
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-border transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <h2 className="text-lg font-medium">Bulk Operations</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <nav className="space-y-1">
            <Link 
              to="/bulk-import" 
              className="block px-3 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              CSV Import
            </Link>
            <Link 
              to="/batch-classify" 
              className="block px-3 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              Batch Classification
            </Link>
            <Link 
              to="/export-results" 
              className="block px-3 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              Export Results
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="w-full border-b border-border/40 backdrop-blur-sm bg-background/80 fixed top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="mr-4 p-2 rounded-full hover:bg-secondary/80 transition-colors md:flex"
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
